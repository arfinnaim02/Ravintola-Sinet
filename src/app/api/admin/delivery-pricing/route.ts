export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

async function getOrCreatePricing() {
  const existing = await prisma.deliveryPricing.findFirst();

  if (existing) return existing;

  return prisma.deliveryPricing.create({
    data: {
      isActive: true,
      baseKm: 2,
      baseFee: 1.99,
      perKmFee: 0.99,
      maxFee: 8.99,
    },
  });
}

export async function GET() {
  try {
    const pricing = await getOrCreatePricing();
    return NextResponse.json({ success: true, pricing });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load pricing." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const current = await getOrCreatePricing();

    const pricing = await prisma.deliveryPricing.update({
      where: { id: current.id },
      data: {
        isActive: Boolean(body.isActive),
        baseKm: Number(body.baseKm || 0),
        baseFee: Number(body.baseFee || 0),
        perKmFee: Number(body.perKmFee || 0),
        maxFee: Number(body.maxFee || 0),
      },
    });

    return NextResponse.json({ success: true, pricing });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update pricing." },
      { status: 500 }
    );
  }
}