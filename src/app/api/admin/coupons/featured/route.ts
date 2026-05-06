export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

export async function GET() {
  try {
    const prisma = await getPrisma();

    const now = new Date();

    const coupons = await prisma.deliveryCoupon.findMany({
      where: {
        isActive: true,
        isFeatured: true,

        OR: [
          { startAt: null },
          { startAt: { lte: now } },
        ],

        AND: [
          {
            OR: [
              { endAt: null },
              { endAt: { gte: now } },
            ],
          },
        ],
      },

      orderBy: [
        { featuredOrder: "asc" },
        { createdAt: "desc" },
      ],

      take: 2,
    });

    const filteredCoupons = coupons.filter((coupon) => {
      if (coupon.maxUses === null) return true;

      return coupon.usedCount < coupon.maxUses;
    });

    return NextResponse.json({
      success: true,
      coupons: filteredCoupons,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message || "Failed to load featured coupons.",
      },
      { status: 500 }
    );
  }
}