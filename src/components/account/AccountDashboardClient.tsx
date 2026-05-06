"use client";

import Link from "next/link";
import { useLanguage } from "../../i18n/LanguageContext";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

type Address = {
  id: string;
  label: string;
  addressLabel: string;
  addressExtra: string;
  lat: number;
  lng: number;
  distanceKm: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
};

type OrderItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  addonsTotal: number;
};

type Order = {
  id: string;
  status: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerNote: string;
  paymentMethod: string;
  addressLabel: string;
  addressExtra: string;
  lat: number;
  lng: number;
  distanceKm: number;
  subtotal: number;
  deliveryFee: number;
  couponCode: string;
  couponDiscount: number;
  total: number;
  items: OrderItem[];
};

type ReservationItem = {
  id: string;
  qty: number;
  unitPrice: number;
  addonsTotal: number;
};

type Reservation = {
  id: string;
  startDatetime: string;
  name: string;
  phone: string;
  email: string;
  partySize: number;
  babySeats: number;
  preferredTable: number | null;
  tablesNeeded: number;
  notes: string;
  status: string;
  createdAt: string;
  items: ReservationItem[];
};

type Loyalty = {
  program: {
    isActive: boolean;
    targetOrders: number;
    rewardPercent: number;
  };
  deliveredCount: number;
  remainingOrders: number;
  rewardUnlocked: boolean;
  reward: {
    couponCode: string;
    rewardPercent: number;
  } | null;
};

type Props = {
  user: User;
  addresses: Address[];
  orders: Order[];
  reservations: Reservation[];
  loyalty: Loyalty;
};

function money(value: any) {
  return `€${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (status === "completed" || status === "confirmed") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (status === "cancelled") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  return "bg-white text-[#3b1f18] border-[#eadfce]";
}

export default function AccountDashboardClient({
  user,
  addresses,
  orders,
  reservations,
  loyalty,
}: Props) {
  const { t } = useLanguage();

  const completedOrders = orders.filter((order) => order.status === "completed");

  const totalSpent = completedOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const totalItems = orders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (itemSum, item) => itemSum + Number(item.qty || 0),
        0
      ),
    0
  );

  const loyaltyPercent = Math.min(
    100,
    (loyalty.deliveredCount / loyalty.program.targetOrders) * 100
  );

  return (
    <main className="min-h-screen bg-[#f4eee4]">
      <section className="relative overflow-hidden bg-[#1b0e0a] px-4 py-16 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(215,184,117,0.22),transparent_35%),radial-gradient(circle_at_85%_25%,rgba(255,255,255,0.08),transparent_28%)]" />

        <div className="sinet-container relative">
          <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#d7b875]">
            {t("accountEyebrow")}
          </p>

          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl font-black sm:text-5xl">
                {t("accountWelcome")}, {user.name}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                {t("accountSubtitle")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/menu"
                className="rounded-full bg-[#d7b875] px-5 py-3 text-sm font-black text-[#3b1f18]"
              >
                {t("orderFood")}
              </Link>

              <Link
                href="/book"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-black text-white"
              >
                {t("bookTable")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="sinet-container py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/10">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#b09876]">
              {t("totalOrders")}
            </p>
            <p className="mt-4 font-display text-4xl font-black text-[#3b1f18]">
              {orders.length}
            </p>
          </div>

          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/10">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#b09876]">
              {t("completed")}
            </p>
            <p className="mt-4 font-display text-4xl font-black text-[#3b1f18]">
              {completedOrders.length}
            </p>
          </div>

          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/10">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#b09876]">
              {t("totalSpent")}
            </p>
            <p className="mt-4 font-display text-4xl font-black text-[#3b1f18]">
              {money(totalSpent)}
            </p>
          </div>

          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/10">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#b09876]">
              {t("itemsOrdered")}
            </p>
            <p className="mt-4 font-display text-4xl font-black text-[#3b1f18]">
              {totalItems}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-[#e0d3bf] bg-white shadow-xl shadow-[#3b1f18]/10">
              <div className="bg-[#3b1f18] p-6 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7b875]">
                  {t("loyaltyReward")}
                </p>

                <h2 className="mt-2 font-display text-3xl font-black">
                  {t("monthlyRewardProgress")}
                </h2>

                <p className="mt-2 text-sm text-white/70">
                  {t("completeOrdersToUnlock")}{" "}
                  {loyalty.program.targetOrders}{" "}
                  {t("deliveredOrdersThisMonth")}{" "}
                  {loyalty.program.rewardPercent}% off.
                </p>
              </div>

              <div className="p-6">
                <div className="flex justify-between text-sm text-[#7b6255]">
                  <span>{t("completedOrdersThisMonth")}</span>
                  <strong className="text-[#3b1f18]">
                    {loyalty.deliveredCount} / {loyalty.program.targetOrders}
                  </strong>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#eadfce]">
                  <div
                    className="h-full rounded-full bg-[#c9a45c]"
                    style={{ width: `${loyaltyPercent}%` }}
                  />
                </div>

                {loyalty.rewardUnlocked && loyalty.reward ? (
                  <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm">
                    <p className="font-black text-green-800">
                      {t("rewardUnlocked")}: {loyalty.reward.rewardPercent}% off
                    </p>

                    <p className="mt-2 font-black text-[#3b1f18]">
                      {t("couponCode")}: {loyalty.reward.couponCode}
                    </p>

                    <p className="mt-2 text-xs font-bold text-green-700">
                      {t("useCouponAtCheckout")}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-bold text-[#7b6255]">
                    {loyalty.remainingOrders} {t("moreCompletedOrdersNeeded")}
                    {loyalty.remainingOrders === 1 ? "" : "s"}{" "}
                    {t("neededToUnlock")} {loyalty.program.rewardPercent}% off.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
                    {t("addresses")}
                  </p>

                  <h2 className="mt-2 font-display text-2xl font-black text-[#3b1f18]">
                    {t("savedAddresses")}
                  </h2>
                </div>

                <Link
                  href="/account/addresses"
                  className="rounded-full bg-[#3b1f18] px-4 py-2 text-xs font-black text-white"
                >
                  {t("manage")}
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {addresses.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-5 text-sm text-[#7b6255]">
                    {t("noSavedAddress")}
                  </p>
                ) : (
                  addresses.map((address) => (
                    <div
                      key={address.id}
                      className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4"
                    >
                      <p className="font-black text-[#3b1f18]">
                        {address.label}
                        {address.isDefault ? ` · ${t("defaultAddress")}` : ""}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#7b6255]">
                        {address.addressLabel}
                      </p>

                      <p className="mt-1 text-xs font-bold text-[#9c806b]">
                        {address.distanceKm.toFixed(2)} {t("kmFromRestaurant")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
                    {t("orders")}
                  </p>

                  <h2 className="mt-2 font-display text-3xl font-black text-[#3b1f18]">
                    {t("recentOrders")}
                  </h2>
                </div>

                <Link
                  href="/account/orders"
                  className="rounded-full bg-[#3b1f18] px-4 py-2 text-xs font-black text-white"
                >
                  {t("viewAll")}
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {orders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-8 text-center">
                    <p className="text-sm text-[#7b6255]">
                      {t("noOrdersYet")}
                    </p>
                    <Link
                      href="/menu"
                      className="sinet-gold-button mt-5 inline-flex px-7"
                    >
                      {t("orderNow")}
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => (
                    <article
                      key={order.id}
                      className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4 transition hover:border-[#c9a45c]"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-display text-xl font-black text-[#3b1f18]">
                            {money(order.total)}
                          </p>

                          <p className="mt-1 text-xs font-bold text-[#9c806b]">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-4 py-2 text-xs font-black ${statusClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-1 text-sm text-[#7b6255]">
                        {order.items.length}{" "}
                        {order.items.length === 1 ? t("item") : t("items")} ·{" "}
                        {order.addressLabel}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
                    {t("reservations")}
                  </p>

                  <h2 className="mt-2 font-display text-3xl font-black text-[#3b1f18]">
                    {t("recentReservations")}
                  </h2>
                </div>

                <Link
                  href="/book"
                  className="rounded-full bg-[#3b1f18] px-4 py-2 text-xs font-black text-white"
                >
                  {t("bookTable")}
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {reservations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-8 text-center">
                    <p className="text-sm text-[#7b6255]">
                      {t("noReservationsFound")}
                    </p>
                  </div>
                ) : (
                  reservations.map((reservation) => (
                    <article
                      key={reservation.id}
                      className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4 transition hover:border-[#c9a45c]"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-display text-xl font-black text-[#3b1f18]">
                            {t("tableFor")} {reservation.partySize}
                          </p>

                          <p className="mt-1 text-xs font-bold text-[#9c806b]">
                            {formatDate(reservation.startDatetime)}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-4 py-2 text-xs font-black ${statusClass(
                            reservation.status
                          )}`}
                        >
                          {reservation.status}
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-[#7b6255]">
                        {reservation.tablesNeeded}{" "}
                        {reservation.tablesNeeded === 1
                          ? t("table")
                          : t("tables")}{" "}
                        · {reservation.babySeats}{" "}
                        {reservation.babySeats === 1
                          ? t("babySeat")
                          : t("babySeats")}
                      </p>

                      {reservation.notes && (
                        <p className="mt-2 line-clamp-2 text-xs font-semibold text-[#9c806b]">
                          {t("note")}: {reservation.notes}
                        </p>
                      )}
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}