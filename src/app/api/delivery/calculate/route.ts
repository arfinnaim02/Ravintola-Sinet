export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function calculateFee({
  distanceKm,
  baseKm,
  baseFee,
  perKmFee,
  maxFee,
}: {
  distanceKm: number;
  baseKm: number;
  baseFee: number;
  perKmFee: number;
  maxFee: number;
}) {
  if (distanceKm <= 0) return 0;

  const extraKm = Math.max(0, distanceKm - baseKm);
  const rawFee = baseFee + extraKm * perKmFee;

  return Math.min(rawFee, maxFee);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const distanceKm = Number(body.distanceKm || 0);
    const subtotal = Number(body.subtotal || 0);

    const pricing = await prisma.deliveryPricing.findFirst({
      where: { isActive: true },
    });

    if (!pricing) {
      return NextResponse.json({
        success: true,
        distanceKm,
        deliveryFee: 0,
        promoApplied: false,
        promoTitle: "",
      });
    }
    
    if (distanceKm > Number(pricing.maxDistanceKm || 0)) {
  return NextResponse.json(
    {
      success: false,
      message: `This address is outside our delivery area. Maximum delivery distance is ${Number(
        pricing.maxDistanceKm
      ).toFixed(1)} km.`,
      distanceKm,
      maxDistanceKm: Number(pricing.maxDistanceKm),
      outOfDeliveryArea: true,
    },
    { status: 400 }
  );
}

    let deliveryFee = calculateFee({
      distanceKm,
      baseKm: Number(pricing.baseKm),
      baseFee: Number(pricing.baseFee),
      perKmFee: Number(pricing.perKmFee),
      maxFee: Number(pricing.maxFee),
    });

    const promo = await prisma.deliveryPromotion.findFirst({
      where: {
        isActive: true,
        freeDelivery: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let promoApplied = false;
    let promoTitle = "";

    if (promo) {
      const now = new Date();
      const validStart = !promo.startAt || now >= promo.startAt;
      const validEnd = !promo.endAt || now <= promo.endAt;
      const validSubtotal = subtotal >= Number(promo.minSubtotal || 0);

      if (validStart && validEnd && validSubtotal) {
        deliveryFee = 0;
        promoApplied = true;
        promoTitle = promo.title;
      }
    }

    return NextResponse.json({
      success: true,
      distanceKm,
      deliveryFee,
      promoApplied,
      promoTitle,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to calculate delivery.",
      },
      { status: 500 }
    );
  }
}