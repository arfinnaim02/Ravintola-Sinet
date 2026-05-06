export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { getLoyaltyProgress } from "../../lib/loyalty";
import AccountDashboardClient from "../../components/account/AccountDashboardClient";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const [addresses, orders, reservations, loyalty] = await Promise.all([
    prisma.customerAddress.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),

    prisma.deliveryOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        items: true,
      },
    }),

    prisma.reservation.findMany({
      where: {
        OR: [{ email: user.email }, { phone: user.phone || "__NO_PHONE__" }],
      },
      orderBy: { startDatetime: "desc" },
      take: 4,
      include: {
        items: true,
      },
    }),

    getLoyaltyProgress(user.id),
  ]);

  const safeAddresses = addresses.map((address) => ({
    ...address,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
  }));

  const safeOrders = orders.map((order) => ({
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
    })),
  }));

  const safeReservations = reservations.map((reservation) => ({
    ...reservation,
    startDatetime: reservation.startDatetime.toISOString(),
    createdAt: reservation.createdAt.toISOString(),
    items: reservation.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice || 0),
      addonsTotal: Number(item.addonsTotal || 0),
    })),
  }));

  return (
    <AccountDashboardClient
      user={user}
      addresses={safeAddresses}
      orders={safeOrders}
      reservations={safeReservations}
      loyalty={loyalty}
    />
  );
}