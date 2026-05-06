export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function calculateDiscount(coupon: any, subtotal: number, deliveryFee: number) {
  if (coupon.discountType === "percent") {
    return Math.min(subtotal, (subtotal * Number(coupon.discountValue || 0)) / 100);
  }

  if (coupon.discountType === "fixed") {
    return Math.min(subtotal, Number(coupon.discountValue || 0));
  }

  if (coupon.discountType === "free_delivery") {
    return Math.min(deliveryFee, deliveryFee);
  }

  return 0;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const code = normalizeCode(String(body.code || ""));
    const subtotal = Number(body.subtotal || 0);
    const deliveryFee = Number(body.deliveryFee || 0);

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Coupon code is required." },
        { status: 400 }
      );
    }

    const coupon = await prisma.deliveryCoupon.findUnique({
      where: { code },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json(
        { success: false, message: "Invalid or inactive coupon." },
        { status: 400 }
      );
    }

    const now = new Date();

    if (coupon.startAt && now < coupon.startAt) {
      return NextResponse.json(
        { success: false, message: "This coupon is not active yet." },
        { status: 400 }
      );
    }

    if (coupon.endAt && now > coupon.endAt) {
      return NextResponse.json(
        { success: false, message: "This coupon has expired." },
        { status: 400 }
      );
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { success: false, message: "This coupon usage limit has been reached." },
        { status: 400 }
      );
    }

    if (subtotal < Number(coupon.minSubtotal || 0)) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum subtotal is €${Number(coupon.minSubtotal).toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    const discount = calculateDiscount(coupon, subtotal, deliveryFee);

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue || 0),
        discount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to apply coupon." },
      { status: 500 }
    );
  }
}