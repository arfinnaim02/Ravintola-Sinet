export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

async function getPrisma() {
  const { prisma } = await import("../../../../lib/prisma");
  return prisma;
}

async function getLoyalty() {
  return await import("../../../../lib/loyalty");
}

export async function GET() {
  try {
    const prisma = await getPrisma();
    const { ensureDefaultLoyaltyProgram } = await getLoyalty();

    const program = await ensureDefaultLoyaltyProgram();

    const rewards = await prisma.loyaltyReward.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      program,
      rewards,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load loyalty settings.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const prisma = await getPrisma();
    const { ensureDefaultLoyaltyProgram } = await getLoyalty();

    const body = await request.json();
    const existing = await ensureDefaultLoyaltyProgram();

    const program = await prisma.loyaltyProgram.update({
      where: { id: existing.id },
      data: {
        isActive: Boolean(body.isActive),
        targetOrders: Math.max(1, Number(body.targetOrders || 10)),
        rewardPercent: Math.max(1, Math.min(100, Number(body.rewardPercent || 30))),
        couponPrefix: String(body.couponPrefix || "LOYAL").trim().toUpperCase(),
        maxUses: Math.max(1, Number(body.maxUses || 1)),
        minSubtotal: Number(body.minSubtotal || 0),
      },
    });

    return NextResponse.json({
      success: true,
      program,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to update loyalty settings.",
      },
      { status: 500 }
    );
  }
}