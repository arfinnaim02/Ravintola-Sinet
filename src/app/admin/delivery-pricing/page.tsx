"use client";

import { useEffect, useState } from "react";

type Pricing = {
  id: string;
  isActive: boolean;
  baseKm: string | number;
  baseFee: string | number;
  perKmFee: string | number;
  maxFee: string | number;
  maxDistanceKm: string | number;
};

export default function AdminDeliveryPricingPage() {
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [distanceKm, setDistanceKm] = useState("4");
  const [subtotal, setSubtotal] = useState("30");
  const [testResult, setTestResult] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadPricing() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/delivery-pricing", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load pricing.");
      }

      setPricing(data.pricing);
    } catch (err: any) {
      setError(err?.message || "Failed to load pricing.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPricing();
  }, []);

  async function savePricing() {
    if (!pricing) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/delivery-pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricing),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save pricing.");
      }

      setPricing(data.pricing);
      setMessage("Delivery pricing updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to save pricing.");
    } finally {
      setSaving(false);
    }
  }

  async function testDeliveryFee() {
    setTestResult("");
    setError("");

    try {
      const response = await fetch("/api/delivery/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          distanceKm: Number(distanceKm),
          subtotal: Number(subtotal),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to calculate.");
      }

      setTestResult(
        `Distance: ${data.distanceKm} km · Delivery: €${Number(
          data.deliveryFee
        ).toFixed(2)}${data.promoApplied ? ` · Promo: ${data.promoTitle}` : ""}`
      );
    } catch (err: any) {
      setError(err?.message || "Failed to calculate delivery.");
    }
  }

  return (
    <main>
      <section className="border-b border-[#ddcfba] bg-white px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            Admin / Delivery
          </p>

          <h1 className="mt-2 font-display text-4xl font-black text-[#3b1f18]">
            Delivery Pricing
          </h1>

          <p className="mt-2 text-sm text-[#7b6255]">
            Option A: manually test distance-based delivery fee before connecting map API.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1fr_420px]">
        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/8">
          <h2 className="font-display text-2xl font-black text-[#3b1f18]">
            Pricing Formula
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

          {loading || !pricing ? (
            <p className="mt-6 text-sm text-[#7b6255]">Loading pricing...</p>
          ) : (
            <div className="mt-6 space-y-5">
              <label className="flex items-center gap-3 rounded-2xl border border-[#eadfce] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#3b1f18]">
                <input
                  type="checkbox"
                  checked={pricing.isActive}
                  onChange={(event) =>
                    setPricing({ ...pricing, isActive: event.target.checked })
                  }
                />
                Delivery pricing active
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                    Base KM
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={String(pricing.baseKm)}
                    onChange={(event) =>
                      setPricing({ ...pricing, baseKm: event.target.value })
                    }
                    className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                    Base Fee (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={String(pricing.baseFee)}
                    onChange={(event) =>
                      setPricing({ ...pricing, baseFee: event.target.value })
                    }
                    className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                    Per KM Fee (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={String(pricing.perKmFee)}
                    onChange={(event) =>
                      setPricing({ ...pricing, perKmFee: event.target.value })
                    }
                    className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                    Max Fee (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={String(pricing.maxFee)}
                    onChange={(event) =>
                      setPricing({ ...pricing, maxFee: event.target.value })
                    }
                    className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                    Max Delivery Distance (KM)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={String(pricing.maxDistanceKm)}
                    onChange={(event) =>
                      setPricing({ ...pricing, maxDistanceKm: event.target.value })
                    }
                    className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={savePricing}
                disabled={saving}
                className="sinet-gold-button w-full"
              >
                {saving ? "Saving..." : "Save Pricing"}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/8">
          <h2 className="font-display text-2xl font-black text-[#3b1f18]">
            Test Calculator
          </h2>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                Distance KM
              </label>
              <input
                type="number"
                step="0.01"
                value={distanceKm}
                onChange={(event) => setDistanceKm(event.target.value)}
                className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                Subtotal
              </label>
              <input
                type="number"
                step="0.01"
                value={subtotal}
                onChange={(event) => setSubtotal(event.target.value)}
                className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={testDeliveryFee}
              className="rounded-2xl bg-[#3b1f18] px-5 py-3 text-sm font-black text-white"
            >
              Test Fee
            </button>

            {testResult && (
              <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] px-4 py-4 text-sm font-black text-[#3b1f18]">
                {testResult}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}