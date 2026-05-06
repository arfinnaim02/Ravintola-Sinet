import { prisma } from "./prisma";

type TelegramOrder = {
  id: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerNote: string;
  paymentMethod: string;
  addressLabel: string;
  addressExtra: string;
  distanceKm: number;
  subtotal: any;
  deliveryFee: any;
  couponCode: string | null;
  couponDiscount: any;
  total: any;
  items: {
    name: string;
    qty: number;
    unitPrice: any;
    addonSnapshots: {
      groupName: string;
      optionName: string;
      optionPrice: any;
    }[];
  }[];
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  on_the_way: "On the way",
  completed: "Completed",
  cancelled: "Cancelled",
};

function money(value: any) {
  return `€${Number(value || 0).toFixed(2)}`;
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN || "";
}

function getAdminChatId() {
  return process.env.TELEGRAM_ADMIN_CHAT_ID || "";
}

export function isTelegramConfigured() {
  return Boolean(getBotToken() && getAdminChatId());
}

export function buildTelegramOrderMessage(order: TelegramOrder) {
  const itemsText = order.items
    .map((item) => {
      const addons =
        item.addonSnapshots.length > 0
          ? item.addonSnapshots
              .map(
                (addon) =>
                  `\n   └ ${escapeHtml(addon.groupName)}: ${escapeHtml(
                    addon.optionName
                  )} (${money(addon.optionPrice)})`
              )
              .join("")
          : "";

      return `• ${escapeHtml(item.name)} × ${item.qty} — ${money(
        Number(item.unitPrice || 0) * Number(item.qty || 1)
      )}${addons}`;
    })
    .join("\n");

  const couponText = order.couponCode
    ? `\n<b>Coupon:</b> ${escapeHtml(order.couponCode)} (-${money(
        order.couponDiscount
      )})`
    : "";

  const noteText = order.customerNote
    ? `\n<b>Note:</b> ${escapeHtml(order.customerNote)}`
    : "";

  const extraText = order.addressExtra
    ? `\n<b>Extra:</b> ${escapeHtml(order.addressExtra)}`
    : "";

  return `
<b>New Delivery Order</b>

<b>Order ID:</b> <code>${order.id}</code>
<b>Status:</b> ${statusLabels[order.status] || order.status}

<b>Customer:</b> ${escapeHtml(order.customerName)}
<b>Phone:</b> ${escapeHtml(order.customerPhone)}
<b>Payment:</b> ${escapeHtml(order.paymentMethod)}

<b>Address:</b> ${escapeHtml(order.addressLabel)}${extraText}
<b>Distance:</b> ${Number(order.distanceKm || 0).toFixed(2)} km${noteText}

<b>Items</b>
${itemsText}

<b>Subtotal:</b> ${money(order.subtotal)}
<b>Delivery:</b> ${money(order.deliveryFee)}${couponText}
<b>Total:</b> ${money(order.total)}
`.trim();
}

function buildStatusKeyboard(orderId: string) {
  return {
    inline_keyboard: [
      [
        { text: "Accept", callback_data: `order_status:accepted:${orderId}` },
        { text: "Prepare", callback_data: `order_status:preparing:${orderId}` },
      ],
      [
        { text: "On the way", callback_data: `order_status:on_the_way:${orderId}` },
        { text: "Completed", callback_data: `order_status:completed:${orderId}` },
      ],
      [{ text: "Cancel", callback_data: `order_status:cancelled:${orderId}` }],
    ],
  };
}

export async function sendTelegramOrder(order: TelegramOrder) {
  if (!isTelegramConfigured()) return null;

  const response = await fetch(
    `https://api.telegram.org/bot${getBotToken()}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: getAdminChatId(),
        text: buildTelegramOrderMessage(order),
        parse_mode: "HTML",
        reply_markup: buildStatusKeyboard(order.id),
      }),
    }
  );

  const data = await response.json();

  await prisma.telegramLog.create({
    data: {
      ok: Boolean(data.ok),
      kind: "send_order",
      chatId: String(getAdminChatId()),
      messagePreview: order.id,
      responseText: JSON.stringify(data).slice(0, 1000),
    },
  });

  if (!data.ok) return null;

  return data.result;
}

export async function editTelegramOrderMessage(orderId: string) {
  if (!isTelegramConfigured()) return;

  const order = await prisma.deliveryOrder.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          addonSnapshots: true,
        },
      },
    },
  });

  if (!order || !order.telegramChatId || !order.telegramMessageId) return;

  const response = await fetch(
    `https://api.telegram.org/bot${getBotToken()}/editMessageText`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: order.telegramChatId,
        message_id: Number(order.telegramMessageId),
        text: buildTelegramOrderMessage({
          ...order,
          distanceKm: Number(order.distanceKm || 0),
        }),
        parse_mode: "HTML",
        reply_markup: buildStatusKeyboard(order.id),
      }),
    }
  );

  const data = await response.json();

  await prisma.telegramLog.create({
    data: {
      ok: Boolean(data.ok),
      kind: "edit_order",
      chatId: order.telegramChatId,
      messagePreview: order.id,
      responseText: JSON.stringify(data).slice(0, 1000),
    },
  });
}

export async function answerTelegramCallback(callbackQueryId: string, text: string) {
  if (!getBotToken()) return;

  await fetch(`https://api.telegram.org/bot${getBotToken()}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
      show_alert: false,
    }),
  });
}