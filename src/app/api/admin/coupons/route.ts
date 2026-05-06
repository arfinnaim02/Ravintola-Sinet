export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function parseDate(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return null;
  return new Date(text);
}

function couponPayload(body: any) {
  return {
    isActive: Boolean(body.isActive),
    isPersonal: Boolean(body.isPersonal),
    issuedMonth: String(body.issuedMonth || ""),
    discountType: String(body.discountType || "percent"),
    discountValue: Number(body.discountValue || 0),
    minSubtotal: Number(body.minSubtotal || 0),
    startAt: parseDate(body.startAt),
    endAt: parseDate(body.endAt),
    maxUses:
      body.maxUses === "" || body.maxUses === null || body.maxUses === undefined
        ? null
        : Number(body.maxUses),

    featuredTitle: String(body.featuredTitle || ""),
    featuredSubtitle: String(body.featuredSubtitle || ""),
    featuredIcon: String(body.featuredIcon || "percent"),
    isFeatured: Boolean(body.isFeatured),
    featuredOrder: Number(body.featuredOrder || 0),
  };
}

export async function GET() {
  try {
    const coupons = await prisma.deliveryCoupon.findMany({
      orderBy: [
        { isFeatured: "desc" },
        { featuredOrder: "asc" },
        { isActive: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load coupons." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const code = normalizeCode(String(body.code || ""));

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Coupon code is required." },
        { status: 400 }
      );
    }

    const coupon = await prisma.deliveryCoupon.create({
      data: {
        code,
        ...couponPayload(body),
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create coupon." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id || "");
    const code = normalizeCode(String(body.code || ""));

    if (!id || !code) {
      return NextResponse.json(
        { success: false, message: "Coupon ID and code are required." },
        { status: 400 }
      );
    }

    const coupon = await prisma.deliveryCoupon.update({
      where: { id },
      data: {
        code,
        ...couponPayload(body),
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update coupon." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id || "");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Coupon ID is required." },
        { status: 400 }
      );
    }

    await prisma.deliveryCoupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete coupon." },
      { status: 500 }
    );
  }
}