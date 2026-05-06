export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import { sendTelegramOrder } from "../../../lib/telegram";

type CartAddon = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  optionPrice: number;
};

type CartItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  basePrice: number;
  addonsTotal: number;
  addons: CartAddon[];
};

type OrderBody = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  addressLabel: string;
  addressExtra?: string;
  customerNote?: string;
  paymentMethod: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  cart: CartItem[];
  couponCode?: string;
};

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function formatMoney(value: number) {
  return `€${Number(value || 0).toFixed(2)}`;
}

function isRealSmtpConfigured() {
  const host = process.env.MAIL_HOST || "";

  return Boolean(
    host &&
      host !== "smtp.example.com" &&
      process.env.MAIL_USER &&
      process.env.MAIL_PASS
  );
}

function calculateDeliveryFee({
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

async function calculateServerDelivery(distanceKm: number, subtotal: number) {
  const pricing = await prisma.deliveryPricing.findFirst({
    where: { isActive: true },
  });

  if (!pricing) {
    return {
      deliveryFee: 0,
      promoTitle: "",
      promoFreeDelivery: false,
      promoMinSubtotal: 0,
    };
  }

  let deliveryFee = calculateDeliveryFee({
    distanceKm,
    baseKm: Number(pricing.baseKm),
    baseFee: Number(pricing.baseFee),
    perKmFee: Number(pricing.perKmFee),
    maxFee: Number(pricing.maxFee),
  });

  let promoTitle = "";
  let promoFreeDelivery = false;
  let promoMinSubtotal = 0;

  const promo = await prisma.deliveryPromotion.findFirst({
    where: {
      isActive: true,
      freeDelivery: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (promo) {
    const now = new Date();
    const validStart = !promo.startAt || now >= promo.startAt;
    const validEnd = !promo.endAt || now <= promo.endAt;
    const validSubtotal = subtotal >= Number(promo.minSubtotal || 0);

    if (validStart && validEnd && validSubtotal) {
      deliveryFee = 0;
      promoTitle = promo.title;
      promoFreeDelivery = true;
      promoMinSubtotal = Number(promo.minSubtotal || 0);
    }
  }

  return {
    deliveryFee,
    promoTitle,
    promoFreeDelivery,
    promoMinSubtotal,
  };
}

function calculateDiscount(coupon: any, subtotal: number, deliveryFee: number) {
  if (coupon.discountType === "percent") {
    return Math.min(subtotal, (subtotal * Number(coupon.discountValue || 0)) / 100);
  }

  if (coupon.discountType === "fixed") {
    return Math.min(subtotal, Number(coupon.discountValue || 0));
  }

  if (coupon.discountType === "free_delivery") {
    return Math.min(deliveryFee, deliveryFee);
  }

  return 0;
}

function buildItemsHtml(cart: CartItem[]) {
  return cart
    .map((item) => {
      const addonsHtml =
        item.addons?.length > 0
          ? `
            <ul style="margin:6px 0 0 18px;padding:0;">
              ${item.addons
                .map(
                  (addon) =>
                    `<li>${addon.groupName}: ${addon.optionName} (${formatMoney(
                      Number(addon.optionPrice || 0)
                    )})</li>`
                )
                .join("")}
            </ul>
          `
          : "";

      return `
        <li style="margin-bottom:14px;">
          <strong>${item.name}</strong> × ${item.quantity}<br/>
          Unit price: ${formatMoney(Number(item.unitPrice || 0))}
          ${addonsHtml}
        </li>
      `;
    })
    .join("");
}

async function validateCoupon(code: string, subtotal: number, deliveryFee: number) {
  const normalizedCode = normalizeCode(code);

  if (!normalizedCode) {
    return {
      couponCode: "",
      couponDiscount: 0,
      coupon: null,
    };
  }

  const coupon = await prisma.deliveryCoupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon || !coupon.isActive) {
    throw new Error("Invalid or inactive coupon.");
  }

  const now = new Date();

  if (coupon.startAt && now < coupon.startAt) {
    throw new Error("This coupon is not active yet.");
  }

  if (coupon.endAt && now > coupon.endAt) {
    throw new Error("This coupon has expired.");
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new Error("This coupon usage limit has been reached.");
  }

  if (subtotal < Number(coupon.minSubtotal || 0)) {
    throw new Error(`Minimum subtotal is ${formatMoney(Number(coupon.minSubtotal || 0))}.`);
  }

  return {
    couponCode: coupon.code,
    couponDiscount: calculateDiscount(coupon, subtotal, deliveryFee),
    coupon,
  };
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = (await request.json()) as OrderBody;

    const {
      customerName,
      customerPhone,
      customerEmail,
      addressLabel,
      addressExtra = "",
      customerNote = "",
      paymentMethod = "cash",
      lat = 0,
      lng = 0,
      distanceKm = 0,
      cart,
      couponCode = "",
    } = body;

    if (
      !customerName ||
      !customerPhone ||
      !customerEmail ||
      !addressLabel ||
      !Array.isArray(cart) ||
      cart.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid order data." },
        { status: 400 }
      );
    }

    const subtotal = cart.reduce(
      (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 1),
      0
    );

    const delivery = await calculateServerDelivery(Number(distanceKm || 0), subtotal);
    const deliveryFee = delivery.deliveryFee;

    const couponResult = await validateCoupon(couponCode, subtotal, deliveryFee);
    const couponDiscount = couponResult.couponDiscount;
    const total = Math.max(0, subtotal + deliveryFee - couponDiscount);

    const order = await prisma.deliveryOrder.create({
      data: {
        customerName,
        customerPhone,
        customerNote,
        paymentMethod,

        addressLabel,
        addressExtra,

        lat: Number(lat || 0),
        lng: Number(lng || 0),
        distanceKm: Number(distanceKm || 0),

        subtotal,
        deliveryFee,
        couponCode: couponResult.couponCode,
        couponDiscount,
        total,

        promoTitle: delivery.promoTitle,
        promoFreeDelivery: delivery.promoFreeDelivery,
        promoMinSubtotal: delivery.promoMinSubtotal,

        status: "pending",

        userId: currentUser?.id || null,

        items: {
          create: cart.map((item) => ({
            menuItemId: item.id,
            name: item.name,
            qty: Number(item.quantity || 1),
            unitPrice: Number(item.unitPrice || 0),
            addonsTotal: Number(item.addonsTotal || 0),

            addonSnapshots: {
              create: (item.addons || []).map((addon) => ({
                groupName: addon.groupName,
                optionName: addon.optionName,
                optionPrice: Number(addon.optionPrice || 0),
              })),
            },
          })),
        },
      },
      include: {
        items: {
          include: {
            addonSnapshots: true,
          },
        },
      },
    });

    if (couponResult.coupon) {
      await prisma.deliveryCoupon.update({
        where: { id: couponResult.coupon.id },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });
    }

      try {
        const telegramMessage = await sendTelegramOrder({
          ...order,
          distanceKm: Number(order.distanceKm || 0),
        });

        if (telegramMessage?.chat?.id && telegramMessage?.message_id) {
          await prisma.deliveryOrder.update({
            where: { id: order.id },
            data: {
              telegramChatId: String(telegramMessage.chat.id),
              telegramMessageId: BigInt(telegramMessage.message_id),
              telegramLastStatusSent: order.status,
            },
          });
        }
      } catch (telegramError) {
        console.error("Telegram order notification failed:", telegramError);
      }

      let emailStatus = "skipped";

    if (isRealSmtpConfigured()) {
      try {
        const siteEmail = process.env.SITE_EMAIL || process.env.MAIL_USER || "";

        const transporter = nodemailer.createTransport({
          host: process.env.MAIL_HOST,
          port: Number(process.env.MAIL_PORT || 587),
          secure: process.env.MAIL_SECURE === "true",
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        });

        const itemsHtml = buildItemsHtml(cart);

        const summaryHtml = `
          <p><strong>Subtotal:</strong> ${formatMoney(subtotal)}</p>
          <p><strong>Delivery:</strong> ${formatMoney(deliveryFee)}</p>
          ${
            couponResult.couponCode
              ? `<p><strong>Coupon (${couponResult.couponCode}):</strong> -${formatMoney(couponDiscount)}</p>`
              : ""
          }
          <p><strong>Total:</strong> ${formatMoney(total)}</p>
        `;

        await Promise.all([
          transporter.sendMail({
            from: siteEmail,
            to: siteEmail,
            subject: `New Order — ${customerName}`,
            html: `
              <h2>New Delivery Order</h2>
              <p><strong>Order ID:</strong> ${order.id}</p>
              <p><strong>Name:</strong> ${customerName}</p>
              <p><strong>Phone:</strong> ${customerPhone}</p>
              <p><strong>Email:</strong> ${customerEmail}</p>
              <p><strong>Address:</strong> ${addressLabel}</p>
              <p><strong>Distance:</strong> ${Number(distanceKm || 0).toFixed(2)} km</p>
              ${addressExtra ? `<p><strong>Extra:</strong> ${addressExtra}</p>` : ""}
              ${customerNote ? `<p><strong>Note:</strong> ${customerNote}</p>` : ""}
              <p><strong>Payment:</strong> ${paymentMethod}</p>
              <h3>Items</h3>
              <ul>${itemsHtml}</ul>
              ${summaryHtml}
            `,
          }),
          transporter.sendMail({
            from: siteEmail,
            to: customerEmail,
            subject: "Your Ravintola Sinet order confirmation",
            html: `
              <h2>Thank you for your order, ${customerName}.</h2>
              <p>We have received your order and will start processing it shortly.</p>
              <p><strong>Order ID:</strong> ${order.id}</p>
              <h3>Order Summary</h3>
              <ul>${itemsHtml}</ul>
              ${summaryHtml}
              <p>Ravintola Sinet</p>
            `,
          }),
        ]);

        emailStatus = "sent";
      } catch (emailError) {
        console.error("Email failed, but order was saved:", emailError);
        emailStatus = "failed";
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      emailStatus,
      deliveryFee,
      couponDiscount,
      total,
    });
  } catch (error: any) {
    console.error("Order API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to place order.",
      },
      { status: 500 }
    );
  }
}