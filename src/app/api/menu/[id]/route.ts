export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

async function getPrisma() {
  const { prisma } = await import("../../../../lib/prisma");
  return prisma;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = await getPrisma();

    const item = await prisma.menuItem.findUnique({
      where: {
        id: params.id,
      },
      include: {
        category: true,
        addonGroupLinks: {
          orderBy: {
            order: "asc",
          },
          include: {
            addonGroup: {
              include: {
                options: {
                  where: {
                    isActive: true,
                  },
                  orderBy: {
                    order: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Menu item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (err: any) {
    console.error("Menu item API error:", err);

    return NextResponse.json(
      { error: err?.message || "Failed to load menu item." },
      { status: 500 }
    );
  }
}