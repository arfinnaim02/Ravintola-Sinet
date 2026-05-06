export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

async function getPrisma() {
  const { prisma } = await import("../../../lib/prisma");
  return prisma;
}

export async function GET(req: Request) {
  try {
    const prisma = await getPrisma();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const items = await prisma.menuItem.findMany({
      where: {
        status: "active",
        ...(category ? { category: { slug: category } } : {}),
      },
      include: {
        category: true,
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json(items);
  } catch (err: any) {
    console.error("Menu API error:", err);

    return NextResponse.json(
      {
        error: err?.message || "Failed to load menu items.",
      },
      {
        status: 500,
      }
    );
  }
}