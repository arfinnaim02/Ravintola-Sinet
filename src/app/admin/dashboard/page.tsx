"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type QuickCard = {
  label: string;
  value: number;
  href: string;
};

type KPI = {
  label: string;
  value: string;
  note: string;
};

type RecentOrder = {
  id: string;
  customerName: string;
  createdAt: string;
  status: string;
  total: number;
  addressLabel: string;
  itemCount: number;
};

type TopItem = {
  name: string;
  sold: number;
};

type DashboardResponse = {
  ok: boolean;
  error?: string;
  data?: {
    range: {
      start: string;
      end: string;
    };
    quickCards: QuickCard[];
    kpis: KPI[];
    statusCounts: {
      pendingOrders: number;
      completedOrders: number;
      cancelledOrders: number;
    };
    recentOrders: RecentOrder[];
    topItems: TopItem[];
  };
};

function money(value: number) {
  return `€${Number(value || 0).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const startFromUrl = searchParams.get("start") || "";
  const endFromUrl = searchParams.get("end") || "";

  const [start, setStart] = useState(startFromUrl);
  const [end, setEnd] = useState(endFromUrl);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<DashboardResponse["data"] | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (startFromUrl) params.set("start", startFromUrl);
    if (endFromUrl) params.set("end", endFromUrl);
    return params.toString();
  }, [startFromUrl, endFromUrl]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/admin/dashboard${queryString ? `?${queryString}` : ""}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const json: DashboardResponse = await res.json();

        if (!res.ok || !json.ok || !json.data) {
          throw new Error(json.error || "Failed to load dashboard");
        }

        setPayload(json.data);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [queryString]);

  function onFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    router.push(`/admin/dashboard${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <main className="min-h-screen bg-[#f4eee4]">
      <section className="relative overflow-hidden border-b border-[#ddcfba] bg-[#1b0e0a] px-5 py-10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(215,184,117,0.2),transparent_35%),radial-gradient(circle_at_85%_30%,rgba(255,255,255,0.08),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#d7b875]">
            Ravintola Sinet
          </p>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl font-black sm:text-5xl">
                Admin Dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                Track sales, orders, reservations, coupons and menu performance.
              </p>
            </div>

            <form
              onSubmit={onFilterSubmit}
              className="grid gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <input
                type="date"
                name="start"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-[#3b1f18]"
              />

              <input
                type="date"
                name="end"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-[#3b1f18]"
              />

              <button className="rounded-2xl bg-[#d7b875] px-5 py-3 text-sm font-black text-[#3b1f18]">
                Filter
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        {loading ? (
          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-8 shadow-xl shadow-[#3b1f18]/8">
            <p className="text-sm font-semibold text-[#7b6255]">Loading dashboard…</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-xl shadow-[#3b1f18]/8">
            <h2 className="font-display text-2xl font-black text-[#3b1f18]">
              Dashboard failed to load
            </h2>
            <p className="mt-3 text-sm text-red-700">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="mt-6 rounded-full bg-[#3b1f18] px-5 py-3 text-sm font-black text-white"
            >
              Retry
            </button>
          </div>
        ) : !payload ? (
          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-8 shadow-xl shadow-[#3b1f18]/8">
            <p className="text-sm font-semibold text-[#7b6255]">No data available.</p>
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
              {payload.quickCards.map((card) => (
                <Link
                  key={card.label}
                  href={card.href}
                  className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/8 transition hover:-translate-y-1"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#b09876]">
                    {card.label}
                  </p>
                  <p className="mt-4 font-display text-4xl font-black text-[#3b1f18]">
                    {card.value}
                  </p>
                </Link>
              ))}
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {payload.kpis.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/8"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#b09876]">
                    {item.label}
                  </p>
                  <p className="mt-4 font-display text-4xl font-black text-[#3b1f18]">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#7b6255]">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
                      Orders
                    </p>
                    <h2 className="mt-2 font-display text-3xl font-black text-[#3b1f18]">
                      Recent Orders
                    </h2>
                  </div>

                  <Link
                    href="/admin/orders"
                    className="rounded-full bg-[#3b1f18] px-4 py-2 text-xs font-black text-white"
                  >
                    View All
                  </Link>
                </div>

                <div className="mt-6 space-y-3">
                  {payload.recentOrders.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-8 text-center text-sm text-[#7b6255]">
                      No recent orders found.
                    </p>
                  ) : (
                    payload.recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href="/admin/orders"
                        className="block rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4 transition hover:border-[#c9a45c]"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-display text-xl font-black text-[#3b1f18]">
                              {order.customerName}
                            </p>
                            <p className="mt-1 text-xs font-bold text-[#9c806b]">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#3b1f18]">
                              {order.status}
                            </span>
                            <strong className="font-display text-2xl text-[#3b1f18]">
                              {money(order.total)}
                            </strong>
                          </div>
                        </div>

                        <p className="mt-3 line-clamp-1 text-sm text-[#7b6255]">
                          {order.itemCount} item{order.itemCount === 1 ? "" : "s"} ·{" "}
                          {order.addressLabel}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/8">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
                    Status
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-black text-[#3b1f18]">
                    Order Status
                  </h2>

                  <div className="mt-6 grid gap-3">
                    <div className="flex justify-between rounded-2xl bg-[#fffaf3] px-4 py-3 text-sm">
                      <span>Pending</span>
                      <strong>{payload.statusCounts.pendingOrders}</strong>
                    </div>
                    <div className="flex justify-between rounded-2xl bg-[#fffaf3] px-4 py-3 text-sm">
                      <span>Completed</span>
                      <strong>{payload.statusCounts.completedOrders}</strong>
                    </div>
                    <div className="flex justify-between rounded-2xl bg-[#fffaf3] px-4 py-3 text-sm">
                      <span>Cancelled</span>
                      <strong>{payload.statusCounts.cancelledOrders}</strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/8">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
                    Menu Performance
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-black text-[#3b1f18]">
                    Top Selling Items
                  </h2>

                  <div className="mt-6 space-y-3">
                    {payload.topItems.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-6 text-center text-sm text-[#7b6255]">
                        No item sales yet.
                      </p>
                    ) : (
                      payload.topItems.map((item, index) => (
                        <div
                          key={`${item.name}-${index}`}
                          className="flex items-center justify-between gap-4 rounded-2xl bg-[#fffaf3] px-4 py-3"
                        >
                          <div>
                            <p className="text-xs font-black text-[#b09876]">
                              #{index + 1}
                            </p>
                            <p className="font-bold text-[#3b1f18]">{item.name}</p>
                          </div>
                          <strong className="text-[#3b1f18]">
                            {item.sold} sold
                          </strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f4eee4] p-8">
          <div className="mx-auto max-w-7xl rounded-3xl border border-[#e0d3bf] bg-white p-8 shadow-xl shadow-[#3b1f18]/8">
            <p className="text-sm font-bold text-[#7b6255]">
              Loading dashboard…
            </p>
          </div>
        </main>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
