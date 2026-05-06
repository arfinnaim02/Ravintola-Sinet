export const runtime = "nodejs";
export const dynamic = "force-dynamic";


import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import {
  answerTelegramCallback,
  editTelegramOrderMessage,
} from "../../../../lib/telegram";
import { checkAndGenerateLoyaltyReward } from "../../../../lib/loyalty";

const allowedStatuses = [
  "pending",
  "accepted",
  "preparing",
  "on_the_way",
  "completed",
  "cancelled",
];

function isWebhookAuthorized(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";

  if (!secret) return true;

  const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  return headerSecret === secret || querySecret === secret;
}

export async function POST(request: Request) {
  try {
    if (!isWebhookAuthorized(request)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized webhook." },
        { status: 401 }
      );
    }

    const update = await request.json();
    const callback = update.callback_query;

    if (!callback?.data || !callback?.id) {
      return NextResponse.json({ success: true });
    }

    const data = String(callback.data);
    const parts = data.split(":");

    if (parts[0] !== "order_status") {
      return NextResponse.json({ success: true });
    }

    const status = parts[1];
    const orderId = parts.slice(2).join(":");

    if (!allowedStatuses.includes(status) || !orderId) {
      await answerTelegramCallback(callback.id, "Invalid action.");
      return NextResponse.json({ success: true });
    }

    const existingOrder = await prisma.deliveryOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        userId: true,
      },
    });

    if (!existingOrder) {
      await answerTelegramCallback(callback.id, "Order not found.");
      return NextResponse.json({ success: true });
    }

    await prisma.deliveryOrder.update({
      where: { id: orderId },
      data: {
        status,
        telegramLastStatusSent: status,
        telegramLastActionBy:
          callback.from?.username ||
          callback.from?.first_name ||
          String(callback.from?.id || "telegram"),
        telegramLastActionAt: new Date(),
      },
    });

    if (
      status === "completed" &&
      existingOrder.userId &&
      existingOrder.status !== "completed"
    ) {
      await checkAndGenerateLoyaltyReward(existingOrder.userId);
    }

    await editTelegramOrderMessage(orderId);
    await answerTelegramCallback(callback.id, `Order marked as ${status}.`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Telegram webhook error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Telegram webhook failed.",
      },
      { status: 500 }
    );
  }
}