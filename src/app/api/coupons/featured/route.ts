export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    const coupons = await prisma.deliveryCoupon.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      orderBy: [{ featuredOrder: "asc" }, { createdAt: "desc" }],
      take: 10,
    });

    const validCoupons = coupons
      .filter((coupon) => {
        const validStart = !coupon.startAt || coupon.startAt <= now;
        const validEnd = !coupon.endAt || coupon.endAt >= now;
        const validUses =
          coupon.maxUses === null || coupon.usedCount < coupon.maxUses;

        return validStart && validEnd && validUses;
      })
      .slice(0, 2);

    return NextResponse.json({
      success: true,
      coupons: validCoupons,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load featured coupons.",
      },
      { status: 500 }
    );
  }
}