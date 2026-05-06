"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AddonSnapshot = {
  id: string;
  groupName: string;
  optionName: string;
  optionPrice: number | string;
};

type OrderItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number | string;
  addonSnapshots: AddonSnapshot[];
};

type Order = {
  id: string;
  createdAt: string;
  status: string;
  total: number | string;
  subtotal: number | string;
  deliveryFee: number | string;
  couponDiscount: number | string;
  couponCode: string | null;
  addressLabel: string;
  addressExtra: string | null;
  distanceKm: number | string | null;
  paymentMethod: string;
  items: OrderItem[];
};

type OrdersResponse = {
  ok: boolean;
  error?: string;
  data?: Order[];
};

function money(value: number | string | null | undefined) {
  return `€${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AccountOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/account/orders", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (res.status === 401) {
          router.replace("/login?next=/account/orders");
          return;
        }

        const json: OrdersResponse = await res.json();

        if (!res.ok || !json.ok || !json.data) {
          throw new Error(json.error || "Failed to load orders");
        }

        setOrders(json.data);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#f4eee4]">
      <section className="bg-[#1b0e0a] px-4 py-14 text-white">
        <div className="sinet-container">
          <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#d7b875]">
            Account
          </p>

          <h1 className="mt-3 font-display text-4xl font-black sm:text-5xl">
            My Orders
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
            View your delivery order history, selected items, addons and totals.
          </p>
        </div>
      </section>

      <section className="sinet-container py-10">
        <div className="mb-6">
          <Link
            href="/account"
            className="inline-flex rounded-full border border-[#d8c9ac] bg-white px-5 py-3 text-sm font-black text-[#3b1f18]"
          >
            ← Back to Account
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-8 shadow-xl shadow-[#3b1f18]/10">
            <p className="text-sm font-semibold text-[#7b6255]">Loading orders…</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-xl shadow-[#3b1f18]/10">
            <h2 className="font-display text-2xl font-black text-[#3b1f18]">
              Could not load your orders
            </h2>
            <p className="mt-3 text-sm text-red-700">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="mt-6 rounded-full bg-[#3b1f18] px-5 py-3 text-sm font-black text-white"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#d8c9ac] bg-white p-10 text-center shadow-xl shadow-[#3b1f18]/10">
            <h2 className="font-display text-3xl font-black text-[#3b1f18]">
              No orders yet
            </h2>
            <p className="mt-3 text-sm text-[#7b6255]">
              Your orders will appear here after checkout.
            </p>
            <Link
              href="/menu"
              className="sinet-gold-button mt-6 inline-flex px-8"
            >
              Order Now
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-3xl border border-[#e0d3bf] bg-white shadow-xl shadow-[#3b1f18]/10"
              >
                <div className="grid gap-4 border-b border-[#eadfce] bg-[#fffaf3] p-5 lg:grid-cols-[1fr_160px_160px]">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
                      Order ID
                    </p>
                    <h2 className="mt-1 break-all font-display text-xl font-black text-[#3b1f18]">
                      {order.id}
                    </h2>
                    <p className="mt-2 text-sm text-[#7b6255]">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
                      Status
                    </p>
                    <p className="mt-2 inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-[#3b1f18]">
                      {order.status}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
                      Total
                    </p>
                    <p className="mt-2 font-display text-3xl font-black text-[#3b1f18]">
                      {money(order.total)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 p-5 lg:grid-cols-[1fr_340px]">
                  <section>
                    <h3 className="font-display text-2xl font-black text-[#3b1f18]">
                      Items
                    </h3>

                    <div className="mt-4 space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4"
                        >
                          <div className="flex justify-between gap-4">
                            <div>
                              <p className="font-black text-[#3b1f18]">
                                {item.name} × {item.qty}
                              </p>
                              <p className="mt-1 text-sm text-[#7b6255]">
                                Unit: {money(item.unitPrice)}
                              </p>
                            </div>

                            <p className="font-black text-[#3b1f18]">
                              {money(Number(item.unitPrice) * item.qty)}
                            </p>
                          </div>

                          {item.addonSnapshots.length > 0 && (
                            <div className="mt-3 rounded-xl bg-white px-3 py-2">
                              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#b09876]">
                                Addons
                              </p>

                              <div className="space-y-1">
                                {item.addonSnapshots.map((addon) => (
                                  <div
                                    key={addon.id}
                                    className="flex justify-between gap-3 text-xs text-[#7b6255]"
                                  >
                                    <span>
                                      {addon.groupName}:{" "}
                                      <strong>{addon.optionName}</strong>
                                    </span>
                                    <span className="font-bold">
                                      {Number(addon.optionPrice) > 0
                                        ? money(addon.optionPrice)
                                        : "Free"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  <aside className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-5">
                    <h3 className="font-display text-2xl font-black text-[#3b1f18]">
                      Summary
                    </h3>

                    <div className="mt-4 space-y-3 text-sm text-[#7b6255]">
                      <p>
                        <strong>Address:</strong> {order.addressLabel}
                      </p>

                      {order.addressExtra && (
                        <p>
                          <strong>Extra:</strong> {order.addressExtra}
                        </p>
                      )}

                      <p>
                        <strong>Distance:</strong>{" "}
                        {Number(order.distanceKm || 0).toFixed(2)} km
                      </p>

                      <p>
                        <strong>Payment:</strong> {order.paymentMethod}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-[#eadfce] pt-4">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <strong>{money(order.subtotal)}</strong>
                      </div>

                      <div className="mt-2 flex justify-between text-sm">
                        <span>Delivery</span>
                        <strong>{money(order.deliveryFee)}</strong>
                      </div>

                      {Number(order.couponDiscount) > 0 && (
                        <div className="mt-2 flex justify-between text-sm text-green-700">
                          <span>Coupon ({order.couponCode})</span>
                          <strong>-{money(order.couponDiscount)}</strong>
                        </div>
                      )}

                      <div className="mt-4 flex justify-between border-t border-[#eadfce] pt-4 font-display text-2xl font-black text-[#3b1f18]">
                        <span>Total</span>
                        <span>{money(order.total)}</span>
                      </div>
                    </div>
                  </aside>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
