"use client";

import { useEffect, useState } from "react";

type LoyaltyProgram = {
  id: string;
  isActive: boolean;
  targetOrders: number;
  rewardPercent: number;
  couponPrefix: string;
  maxUses: number;
  minSubtotal: string | number;
};

type LoyaltyReward = {
  id: string;
  issuedMonth: string;
  orderCount: number;
  couponCode: string;
  rewardPercent: number;
  createdAt: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
};

export default function AdminLoyaltyPage() {
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/loyalty", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load loyalty program.");
      }

      setProgram(data.program);
      setRewards(data.rewards || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load loyalty program.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function saveProgram() {
    if (!program) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/loyalty", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(program),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save loyalty program.");
      }

      setProgram(data.program);
      setMessage("Loyalty program updated successfully.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to save loyalty program.");
    } finally {
      setSaving(false);
    }
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  return (
    <main>
      <section className="border-b border-[#ddcfba] bg-white px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            Admin / Rewards
          </p>

          <h1 className="mt-2 font-display text-4xl font-black text-[#3b1f18]">
            Loyalty Rewards
          </h1>

          <p className="mt-2 text-sm text-[#7b6255]">
            Auto-generate personal reward coupons when customers complete enough monthly orders.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/8">
          <h2 className="font-display text-2xl font-black text-[#3b1f18]">
            Reward Settings
          </h2>

          {message && (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {loading || !program ? (
            <p className="mt-6 text-sm text-[#7b6255]">Loading...</p>
          ) : (
            <div className="mt-6 space-y-4">
              <label className="flex items-center gap-3 rounded-2xl border border-[#eadfce] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#3b1f18]">
                <input
                  type="checkbox"
                  checked={program.isActive}
                  onChange={(event) =>
                    setProgram({ ...program, isActive: event.target.checked })
                  }
                />
                Loyalty program active
              </label>

              <div>
                <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                  Required completed orders per month
                </label>
                <input
                  type="number"
                  min={1}
                  value={program.targetOrders}
                  onChange={(event) =>
                    setProgram({
                      ...program,
                      targetOrders: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                  Reward discount percent
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={program.rewardPercent}
                  onChange={(event) =>
                    setProgram({
                      ...program,
                      rewardPercent: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                  Coupon prefix
                </label>
                <input
                  value={program.couponPrefix}
                  onChange={(event) =>
                    setProgram({
                      ...program,
                      couponPrefix: event.target.value.toUpperCase(),
                    })
                  }
                  className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm uppercase"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                  Reward coupon max uses
                </label>
                <input
                  type="number"
                  min={1}
                  value={program.maxUses}
                  onChange={(event) =>
                    setProgram({
                      ...program,
                      maxUses: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                  Minimum subtotal
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={String(program.minSubtotal)}
                  onChange={(event) =>
                    setProgram({
                      ...program,
                      minSubtotal: event.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
                />
              </div>

              <button
                type="button"
                onClick={saveProgram}
                disabled={saving}
                className="sinet-gold-button w-full"
              >
                {saving ? "Saving..." : "Save Loyalty Settings"}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/8">
          <h2 className="font-display text-2xl font-black text-[#3b1f18]">
            Generated Rewards
          </h2>

          {rewards.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-10 text-center text-sm text-[#7b6255]">
              No loyalty rewards generated yet.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {rewards.map((reward) => (
                <article
                  key={reward.id}
                  className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4"
                >
                  <div className="grid gap-3 lg:grid-cols-[1fr_150px_170px]">
                    <div>
                      <h3 className="font-display text-xl font-black text-[#3b1f18]">
                        {reward.user.name}
                      </h3>
                      <p className="mt-1 text-sm text-[#7b6255]">
                        {reward.user.email}
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#9c806b]">
                        {formatDate(reward.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#b09876]">
                        Month
                      </p>
                      <p className="mt-1 font-black text-[#3b1f18]">
                        {reward.issuedMonth}
                      </p>
                      <p className="mt-1 text-sm text-[#7b6255]">
                        {reward.orderCount} orders
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#b09876]">
                        Coupon
                      </p>
                      <p className="mt-1 break-all font-black text-green-700">
                        {reward.couponCode}
                      </p>
                      <p className="mt-1 text-sm text-[#7b6255]">
                        {reward.rewardPercent}% off
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}