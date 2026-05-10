type TelegramOrder = {
  id: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerNote: string;
  paymentMethod: string;
  addressLabel: string;
  addressExtra: string;
  lat?: any;
  lng?: any;
  distanceKm: number;
  subtotal: any;
  deliveryFee: any;
  couponCode: string | null;
  couponDiscount: any;
  total: any;
  telegramLastStatusSent?: string | null;
  telegramLastActionBy?: string | null;
  telegramLastActionAt?: Date | string | null;
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

async function getPrisma() {
  const { prisma } = await import("./prisma");
  return prisma;
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  on_the_way: "On the way",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusIcons: Record<string, string> = {
  pending: "⏳",
  accepted: "✅",
  preparing: "👨‍🍳",
  on_the_way: "🚗",
  completed: "🏁",
  cancelled: "❌",
};

function money(value: any) {
  return `€${Number(value || 0).toFixed(2)}`;
}

function escapeHtml(value: any) {
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

function buildGoogleMapLink(order: TelegramOrder) {
  const lat = Number(order.lat || 0);
  const lng = Number(order.lng || 0);

  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    order.addressLabel || ""
  )}`;
}

function formatActionTime(value: Date | string | null | undefined) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Helsinki",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusLine(order: TelegramOrder) {
  const icon = statusIcons[order.status] || "•";
  const label = statusLabels[order.status] || order.status;

  return `${icon} <b>${escapeHtml(label)}</b>`;
}

function getStatusHistoryText(order: TelegramOrder) {
  if (!order.telegramLastActionAt && !order.telegramLastActionBy) return "";

  const byText = order.telegramLastActionBy
    ? ` by ${escapeHtml(order.telegramLastActionBy)}`
    : "";

  const timeText = order.telegramLastActionAt
    ? ` at ${escapeHtml(formatActionTime(order.telegramLastActionAt))}`
    : "";

  return `\n<b>Last update:</b>${byText}${timeText}`;
}

function getButtonText(status: string, currentStatus: string) {
  const icon = statusIcons[status] || "";
  const label = statusLabels[status] || status;

  if (status === currentStatus) {
    return `✓ ${icon} ${label}`;
  }

  return `${icon} ${label}`;
}

export function buildTelegramOrderMessage(order: TelegramOrder) {
  const mapLink = buildGoogleMapLink(order);

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

  const historyText = getStatusHistoryText(order);

  return `
<b>🍽️ New Delivery Order</b>

<b>Order ID:</b> <code>${escapeHtml(order.id)}</code>
<b>Status:</b> ${getStatusLine(order)}${historyText}

<b>Customer:</b> ${escapeHtml(order.customerName)}
<b>Phone:</b> ${escapeHtml(order.customerPhone)}
<b>Payment:</b> ${escapeHtml(order.paymentMethod)}

<b>Address:</b> ${escapeHtml(order.addressLabel)}${extraText}
<b>Map:</b> <a href="${mapLink}">Open in Google Maps</a>
<b>Distance:</b> ${Number(order.distanceKm || 0).toFixed(2)} km${noteText}

<b>Items</b>
${itemsText || "No items found."}

<b>Subtotal:</b> ${money(order.subtotal)}
<b>Delivery:</b> ${money(order.deliveryFee)}${couponText}
<b>Total:</b> ${money(order.total)}
`.trim();
}

function buildStatusKeyboard(orderId: string, currentStatus = "pending") {
  return {
    inline_keyboard: [
      [
        {
          text: getButtonText("accepted", currentStatus),
          callback_data: `order_status:accepted:${orderId}`,
        },
        {
          text: getButtonText("preparing", currentStatus),
          callback_data: `order_status:preparing:${orderId}`,
        },
      ],
      [
        {
          text: getButtonText("on_the_way", currentStatus),
          callback_data: `order_status:on_the_way:${orderId}`,
        },
        {
          text: getButtonText("completed", currentStatus),
          callback_data: `order_status:completed:${orderId}`,
        },
      ],
      [
        {
          text: getButtonText("cancelled", currentStatus),
          callback_data: `order_status:cancelled:${orderId}`,
        },
      ],
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
        disable_web_page_preview: true,
        reply_markup: buildStatusKeyboard(order.id, order.status),
      }),
    }
  );

  const data = await response.json();

  try {
    const prisma = await getPrisma();

    await prisma.telegramLog.create({
      data: {
        ok: Boolean(data.ok),
        kind: "send_order",
        chatId: String(getAdminChatId()),
        messagePreview: order.id,
        responseText: JSON.stringify(data).slice(0, 1000),
      },
    });
  } catch (logError) {
    console.error("Telegram log save failed:", logError);
  }

  if (!data.ok) return null;

  return data.result;
}

export async function editTelegramOrderMessage(orderId: string) {
  if (!isTelegramConfigured()) return;

  const prisma = await getPrisma();

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
        disable_web_page_preview: true,
        reply_markup: buildStatusKeyboard(order.id, order.status),
      }),
    }
  );

  const data = await response.json();

  try {
    await prisma.telegramLog.create({
      data: {
        ok: Boolean(data.ok),
        kind: "edit_order",
        chatId: order.telegramChatId,
        messagePreview: order.id,
        responseText: JSON.stringify(data).slice(0, 1000),
      },
    });
  } catch (logError) {
    console.error("Telegram edit log save failed:", logError);
  }
}

export async function answerTelegramCallback(
  callbackQueryId: string,
  text: string
) {
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