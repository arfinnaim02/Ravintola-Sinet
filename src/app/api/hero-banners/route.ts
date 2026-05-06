export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const banners = await prisma.heroBanner.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, banners });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load banners." },
      { status: 500 }
    );
  }
}