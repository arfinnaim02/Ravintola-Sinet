export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  try {
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