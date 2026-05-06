"use client";

import { useEffect, useMemo, useState } from "react";

type Coupon = {
    featuredTitle: string;
    featuredSubtitle: string;
    featuredIcon: string;
    isFeatured: boolean;
    featuredOrder: number;
  id: string;
  code: string;
  isActive: boolean;
  isPersonal: boolean;
  issuedMonth: string;
  discountType: string;
  discountValue: string | number;
  minSubtotal: string | number;
  startAt: string | null;
  endAt: string | null;
  maxUses: number | null;
  usedCount: number;
  createdAt: string;
};

const emptyCoupon = {
    featuredTitle: "",
    featuredSubtitle: "",
    featuredIcon: "percent",
    isFeatured: false,
    featuredOrder: "0",
  code: "",
  isActive: true,
  isPersonal: false,
  issuedMonth: "",
  discountType: "percent",
  discountValue: "",
  minSubtotal: "0",
  startAt: "",
  endAt: "",
  maxUses: "",
};

function toDateInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCoupon, setNewCoupon] = useState<any>(emptyCoupon);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCoupons() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/coupons", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load coupons.");
      }

      setCoupons(data.coupons);
    } catch (err: any) {
      setError(err?.message || "Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  const filteredCoupons = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return coupons;

    return coupons.filter((coupon) => {
      return (
        coupon.code.toLowerCase().includes(value) ||
        coupon.discountType.toLowerCase().includes(value) ||
        coupon.issuedMonth.toLowerCase().includes(value)
      );
    });
  }, [coupons, search]);

  function updateLocalCoupon(id: string, field: keyof Coupon, value: any) {
    setCoupons((current) =>
      current.map((coupon) =>
        coupon.id === id ? { ...coupon, [field]: value } : coupon
      )
    );
  }

  async function createCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCoupon),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create coupon.");
      }

      setNewCoupon(emptyCoupon);
      setMessage("Coupon created successfully.");
      await loadCoupons();
    } catch (err: any) {
      setError(err?.message || "Failed to create coupon.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCoupon(coupon: Coupon) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...coupon,
          startAt: toDateInput(coupon.startAt),
          endAt: toDateInput(coupon.endAt),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save coupon.");
      }

      setMessage("Coupon updated successfully.");
      await loadCoupons();
    } catch (err: any) {
      setError(err?.message || "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCoupon(coupon: Coupon) {
    const confirmed = window.confirm(`Delete coupon "${coupon.code}"?`);
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/coupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete coupon.");
      }

      setMessage("Coupon deleted successfully.");
      await loadCoupons();
    } catch (err: any) {
      setError(err?.message || "Failed to delete coupon.");
    } finally {
      setSaving(false);
    }
  }

  function discountText(coupon: Coupon) {
    if (coupon.discountType === "percent") return `${coupon.discountValue}%`;
    if (coupon.discountType === "fixed") return `€${Number(coupon.discountValue).toFixed(2)}`;
    return "Free delivery";
  }

  return (
    <main>
      <section className="border-b border-[#ddcfba] bg-white px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            Admin / Orders
          </p>
          <h1 className="mt-2 font-display text-4xl font-black text-[#3b1f18]">
            Coupons
          </h1>
          <p className="mt-2 text-sm text-[#7b6255]">
            Create and manage percent, fixed amount, and free-delivery coupons.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 xl:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/8">
          <h2 className="font-display text-2xl font-black text-[#3b1f18]">
            Create Coupon
          </h2>

          <form onSubmit={createCoupon} className="mt-6 space-y-4">
            <input
              value={newCoupon.code}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, code: e.target.value })
              }
              placeholder="SORRY530"
              required
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm uppercase"
            />

            <select
              value={newCoupon.discountType}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, discountType: e.target.value })
              }
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            >
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed (€)</option>
              <option value="free_delivery">Free Delivery</option>
            </select>

            <input
              value={newCoupon.discountValue}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, discountValue: e.target.value })
              }
              type="number"
              step="0.01"
              placeholder="Discount value"
              disabled={newCoupon.discountType === "free_delivery"}
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm disabled:opacity-50"
            />

            <input
              value={newCoupon.minSubtotal}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, minSubtotal: e.target.value })
              }
              type="number"
              step="0.01"
              placeholder="Minimum subtotal"
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <input
              value={newCoupon.maxUses}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, maxUses: e.target.value })
              }
              type="number"
              placeholder="Max uses"
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <input
              value={newCoupon.issuedMonth}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, issuedMonth: e.target.value })
              }
              placeholder="Issued month, e.g. 2026-05"
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-black text-[#7b6255]">
                  Start Date
                </label>
                <input
                  value={newCoupon.startAt}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, startAt: e.target.value })
                  }
                  type="date"
                  className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-black text-[#7b6255]">
                  End Date
                </label>
                <input
                  value={newCoupon.endAt}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, endAt: e.target.value })
                  }
                  type="date"
                  className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
                />
              </div>
            </div>

                  <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#b09876]">
                        Featured Menu Coupon
                    </p>

                    <input
                        value={newCoupon.featuredTitle}
                        onChange={(e) =>
                        setNewCoupon({ ...newCoupon, featuredTitle: e.target.value })
                        }
                        placeholder="Special – 10% Off"
                        className="mb-3 w-full rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                    />

                    <input
                        value={newCoupon.featuredSubtitle}
                        onChange={(e) =>
                        setNewCoupon({ ...newCoupon, featuredSubtitle: e.target.value })
                        }
                        placeholder="on Your First Order"
                        className="mb-3 w-full rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                    />

                    <select
                        value={newCoupon.featuredIcon}
                        onChange={(e) =>
                        setNewCoupon({ ...newCoupon, featuredIcon: e.target.value })
                        }
                        className="mb-3 w-full rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                    >
                        <option value="percent">Percent Badge</option>
                        <option value="delivery">Delivery Truck</option>
                        <option value="gift">Gift</option>
                    </select>

                    <input
                        value={newCoupon.featuredOrder}
                        onChange={(e) =>
                        setNewCoupon({ ...newCoupon, featuredOrder: e.target.value })
                        }
                        type="number"
                        placeholder="Featured order"
                        className="mb-3 w-full rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                    />

                    <label className="flex items-center gap-3 text-sm font-bold text-[#3b1f18]">
                        <input
                        type="checkbox"
                        checked={newCoupon.isFeatured}
                        onChange={(e) =>
                            setNewCoupon({ ...newCoupon, isFeatured: e.target.checked })
                        }
                        />
                        Show on menu page
                    </label>
                    </div>

            <label className="flex items-center gap-3 rounded-2xl border border-[#eadfce] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#3b1f18]">
              <input
                type="checkbox"
                checked={newCoupon.isPersonal}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, isPersonal: e.target.checked })
                }
              />
              Personal Coupon
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-[#eadfce] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#3b1f18]">
              <input
                type="checkbox"
                checked={newCoupon.isActive}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, isActive: e.target.checked })
                }
              />
              Active
            </label>

            <button disabled={saving} className="sinet-gold-button w-full">
              {saving ? "Saving..." : "Create Coupon"}
            </button>
          </form>
        </div>

        <div className="space-y-5">
          {message && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-display text-2xl font-black text-[#3b1f18]">
                  Existing Coupons
                </h2>
                <p className="mt-1 text-sm text-[#7b6255]">
                  {filteredCoupons.length} coupon
                  {filteredCoupons.length === 1 ? "" : "s"} shown
                </p>
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code, type, month..."
                className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm lg:max-w-sm"
              />
            </div>

            {loading ? (
              <p className="mt-5 text-sm text-[#7b6255]">Loading coupons...</p>
            ) : filteredCoupons.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-10 text-center text-sm text-[#7b6255]">
                No coupons found.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {filteredCoupons.map((coupon) => {
                  const expanded = expandedId === coupon.id;

                  return (
                    <article
                      key={coupon.id}
                      className="rounded-2xl border border-[#eadfce] bg-[#fffaf3]"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : coupon.id)}
                        className="grid w-full gap-4 p-4 text-left lg:grid-cols-[1fr_150px_140px_130px]"
                      >
                        <div>
                          <h3 className="font-display text-xl font-black text-[#3b1f18]">
                            {coupon.code}
                          </h3>
                          <p className="mt-1 text-sm text-[#7b6255]">
                            {coupon.discountType} · min €{Number(coupon.minSubtotal).toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b09876]">
                            Discount
                          </p>
                          <p className="font-black text-[#3b1f18]">
                            {discountText(coupon)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b09876]">
                            Uses
                          </p>
                          <p className="font-black text-[#3b1f18]">
                            {coupon.usedCount}
                            {coupon.maxUses ? ` / ${coupon.maxUses}` : ""}
                          </p>
                        </div>

                        <div>
                          <p
                            className={`rounded-full px-3 py-1 text-center text-sm font-black ${
                              coupon.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {coupon.isActive ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </button>

                      {expanded && (
                        <div className="border-t border-[#eadfce] p-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              value={coupon.code}
                              onChange={(e) =>
                                updateLocalCoupon(coupon.id, "code", e.target.value)
                              }
                              className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm uppercase"
                            />

                            <select
                              value={coupon.discountType}
                              onChange={(e) =>
                                updateLocalCoupon(
                                  coupon.id,
                                  "discountType",
                                  e.target.value
                                )
                              }
                              className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            >
                              <option value="percent">Percent (%)</option>
                              <option value="fixed">Fixed (€)</option>
                              <option value="free_delivery">Free Delivery</option>
                            </select>

                            <input
                              value={String(coupon.discountValue)}
                              onChange={(e) =>
                                updateLocalCoupon(
                                  coupon.id,
                                  "discountValue",
                                  e.target.value
                                )
                              }
                              type="number"
                              step="0.01"
                              disabled={coupon.discountType === "free_delivery"}
                              className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm disabled:opacity-50"
                            />

                            <input
                              value={String(coupon.minSubtotal)}
                              onChange={(e) =>
                                updateLocalCoupon(
                                  coupon.id,
                                  "minSubtotal",
                                  e.target.value
                                )
                              }
                              type="number"
                              step="0.01"
                              className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            />

                            <input
                              value={coupon.maxUses ?? ""}
                              onChange={(e) =>
                                updateLocalCoupon(
                                  coupon.id,
                                  "maxUses",
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value)
                                )
                              }
                              type="number"
                              placeholder="Max uses"
                              className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            />

                            <input
                              value={coupon.issuedMonth || ""}
                              onChange={(e) =>
                                updateLocalCoupon(
                                  coupon.id,
                                  "issuedMonth",
                                  e.target.value
                                )
                              }
                              placeholder="2026-05"
                              className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            />

                            <input
                              value={toDateInput(coupon.startAt)}
                              onChange={(e) =>
                                updateLocalCoupon(
                                  coupon.id,
                                  "startAt",
                                  e.target.value
                                )
                              }
                              type="date"
                              className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            />

                            <input
                              value={toDateInput(coupon.endAt)}
                              onChange={(e) =>
                                updateLocalCoupon(
                                  coupon.id,
                                  "endAt",
                                  e.target.value
                                )
                              }
                              type="date"
                              className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            />

                            <input
                            value={coupon.featuredTitle || ""}
                            onChange={(e) =>
                                updateLocalCoupon(coupon.id, "featuredTitle", e.target.value)
                            }
                            placeholder="Featured title"
                            className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            />

                            <input
                            value={coupon.featuredSubtitle || ""}
                            onChange={(e) =>
                                updateLocalCoupon(coupon.id, "featuredSubtitle", e.target.value)
                            }
                            placeholder="Featured subtitle"
                            className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            />

                            <select
                            value={coupon.featuredIcon || "percent"}
                            onChange={(e) =>
                                updateLocalCoupon(coupon.id, "featuredIcon", e.target.value)
                            }
                            className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            >
                            <option value="percent">Percent Badge</option>
                            <option value="delivery">Delivery Truck</option>
                            <option value="gift">Gift</option>
                            </select>

                            <input
                            value={coupon.featuredOrder || 0}
                            onChange={(e) =>
                                updateLocalCoupon(coupon.id, "featuredOrder", Number(e.target.value))
                            }
                            type="number"
                            placeholder="Featured order"
                            className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            />

                            <label className="flex items-center gap-2 text-sm font-bold text-[#3b1f18]">
                            <input
                                type="checkbox"
                                checked={coupon.isFeatured}
                                onChange={(e) =>
                                updateLocalCoupon(coupon.id, "isFeatured", e.target.checked)
                                }
                            />
                            Show on menu page
                            </label>

                            <label className="flex items-center gap-2 text-sm font-bold text-[#3b1f18]">
                              <input
                                type="checkbox"
                                checked={coupon.isPersonal}
                                onChange={(e) =>
                                  updateLocalCoupon(
                                    coupon.id,
                                    "isPersonal",
                                    e.target.checked
                                  )
                                }
                              />
                              Personal
                            </label>

                            <label className="flex items-center gap-2 text-sm font-bold text-[#3b1f18]">
                              <input
                                type="checkbox"
                                checked={coupon.isActive}
                                onChange={(e) =>
                                  updateLocalCoupon(
                                    coupon.id,
                                    "isActive",
                                    e.target.checked
                                  )
                                }
                              />
                              Active
                            </label>
                          </div>

                          <div className="mt-4 flex gap-3">
                            <button
                              type="button"
                              onClick={() => saveCoupon(coupon)}
                              disabled={saving}
                              className="rounded-xl bg-[#3b1f18] px-4 py-2 text-sm font-black text-white"
                            >
                              Save
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteCoupon(coupon)}
                              disabled={saving}
                              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-black text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}