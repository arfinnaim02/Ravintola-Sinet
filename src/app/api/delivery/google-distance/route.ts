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

    const lat = Number(body.lat || 0);
    const lng = Number(body.lng || 0);
    const subtotal = Number(body.subtotal || 0);

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, message: "Valid location is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const origin =
      process.env.RESTAURANT_ADDRESS || "Kauppakatu 28, Joensuu, Finland";

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "Google Maps API key is missing." },
        { status: 500 }
      );
    }

    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", origin);
    url.searchParams.set("destinations", `${lat},${lng}`);
    url.searchParams.set("mode", "driving");
    url.searchParams.set("units", "metric");
    url.searchParams.set("key", apiKey);

    const googleResponse = await fetch(url.toString(), { cache: "no-store" });
    const googleData = await googleResponse.json();

    const element = googleData?.rows?.[0]?.elements?.[0];

  if (!googleResponse.ok || !element || element.status !== "OK") {
    console.error("Google Distance Error:", JSON.stringify(googleData, null, 2));

    const googleStatus = element?.status || googleData?.status || "UNKNOWN";

    return NextResponse.json(
      {
        success: false,
        message:
          googleStatus === "ZERO_RESULTS"
            ? "This address is outside our delivery range. Please choose another address closer to Ravintola Sinet."
            : googleData?.error_message || "Google distance calculation failed.",
        googleStatus,
      },
      { status: 400 }
    );
  }

    const distanceMeters = Number(element.distance.value || 0);
    const distanceKm = distanceMeters / 1000;
    const durationText = element.duration?.text || "";

    const pricing = await prisma.deliveryPricing.findFirst({
      where: { isActive: true },
    });

  if (pricing && distanceKm > Number(pricing.maxDistanceKm || 0)) {
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

  let deliveryFee = 0;

  if (pricing) {
    deliveryFee = calculateFee({
        distanceKm,
        baseKm: Number(pricing.baseKm),
        baseFee: Number(pricing.baseFee),
        perKmFee: Number(pricing.perKmFee),
        maxFee: Number(pricing.maxFee),
      });
    }

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
      lat,
      lng,
      distanceKm,
      durationText,
      deliveryFee,
      promoApplied,
      promoTitle,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to calculate delivery distance.",
      },
      { status: 500 }
    );
  }
}