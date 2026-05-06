export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

async function getDeps() {
  const [{ prisma }, { getCurrentUser }] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/auth"),
  ]);

  return { prisma, getCurrentUser };
}

export async function GET() {
  try {
    const { prisma, getCurrentUser } = await getDeps();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orders = await prisma.deliveryOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            addonSnapshots: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      data: orders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        subtotal: Number(order.subtotal || 0),
        deliveryFee: Number(order.deliveryFee || 0),
        couponDiscount: Number(order.couponDiscount || 0),
        total: Number(order.total || 0),
        promoMinSubtotal: Number(order.promoMinSubtotal || 0),
        telegramMessageId: order.telegramMessageId
          ? order.telegramMessageId.toString()
          : null,
        telegramLastActionAt: order.telegramLastActionAt
          ? order.telegramLastActionAt.toISOString()
          : null,
        items: order.items.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice || 0),
          addonsTotal: Number(item.addonsTotal || 0),
          addonSnapshots: item.addonSnapshots.map((addon) => ({
            ...addon,
            optionPrice: Number(addon.optionPrice || 0),
          })),
        })),
      })),
    });
  } catch (error) {
    console.error("Account orders API error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}