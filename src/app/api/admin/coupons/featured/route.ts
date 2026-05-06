export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    const coupons = await prisma.deliveryCoupon.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [
          {
            OR: [{ endAt: null }, { endAt: { gte: now } }],
          },
          {
            OR: [{ maxUses: null }, { usedCount: { lt: prisma.deliveryCoupon.fields.maxUses } }],
          },
        ],
      },
      orderBy: [{ featuredOrder: "asc" }, { createdAt: "desc" }],
      take: 2,
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load featured coupons." },
      { status: 500 }
    );
  }
}