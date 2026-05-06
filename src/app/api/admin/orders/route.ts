
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { checkAndGenerateLoyaltyReward } from "../../../../lib/loyalty";
import { editTelegramOrderMessage } from "../../../../lib/telegram";
export async function GET() {
  try {
    const orders = await prisma.deliveryOrder.findMany({
      include: {
        items: {
          include: {
            addonSnapshots: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load orders." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const ids = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];
    const status = String(body.status || "");

    if (ids.length === 0 || !status) {
      return NextResponse.json(
        { success: false, message: "Order ID and status are required." },
        { status: 400 }
      );
    }

const updatedOrders = await prisma.deliveryOrder.findMany({
  where: {
    id: {
      in: ids,
    },
  },
  select: {
    id: true,
    userId: true,
    status: true,
  },
});

  await prisma.deliveryOrder.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: {
      status,
    },
  });

  const generatedRewards = [];

  if (status === "completed") {
    for (const order of updatedOrders) {
      if (!order.userId || order.status === "completed") continue;

      const reward = await checkAndGenerateLoyaltyReward(order.userId);

      if (reward) {
        generatedRewards.push(reward);
      }
    }
  }

  for (const id of ids) {
    try {
      await editTelegramOrderMessage(id);
    } catch (telegramError) {
      console.error("Telegram message edit failed:", telegramError);
    }
  }

  return NextResponse.json({
    success: true,
    generatedRewards,
  });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update order." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    const ids = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "Order ID is required." },
        { status: 400 }
      );
    }

    await prisma.deliveryOrder.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete order." },
      { status: 500 }
    );
  }
}