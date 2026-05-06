"use client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import DeliveryLocationModal from "../../../components/DeliveryLocationModal";

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
};

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const [label, setLabel] = useState("Home");
  const [addressExtra, setAddressExtra] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAddresses() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/account/addresses", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load addresses.");
      }

      setAddresses(data.addresses);
    } catch (err: any) {
      setError(err?.message || "Failed to load addresses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  async function saveAddress() {
    if (!selectedLocation) {
      setError("Please select a delivery location first.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/account/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label,
          addressExtra,
          isDefault,
          addressLabel: selectedLocation.addressLabel,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          distanceKm: selectedLocation.distanceKm,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save address.");
      }

      setMessage("Address saved successfully.");
      setSelectedLocation(null);
      setAddressExtra("");
      setLabel("Home");
      setIsDefault(false);
      await loadAddresses();
    } catch (err: any) {
      setError(err?.message || "Failed to save address.");
    } finally {
      setSaving(false);
    }
  }

  async function setDefaultAddress(address: Address) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/account/addresses", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: address.id,
          label: address.label,
          addressExtra: address.addressExtra,
          isDefault: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update address.");
      }

      setMessage("Default address updated.");
      await loadAddresses();
    } catch (err: any) {
      setError(err?.message || "Failed to update address.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddress(address: Address) {
    const confirmed = window.confirm(`Delete "${address.label}" address?`);
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/account/addresses", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: address.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete address.");
      }

      setMessage("Address deleted.");
      await loadAddresses();
    } catch (err: any) {
      setError(err?.message || "Failed to delete address.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4eee4]">
      <DeliveryLocationModal
        open={locationModalOpen}
        subtotal={0}
        onClose={() => setLocationModalOpen(false)}
        onConfirm={(data) => {
          setSelectedLocation(data);
          setLocationModalOpen(false);
        }}
      />

      <section className="bg-[#1b0e0a] px-4 py-14 text-white">
        <div className="sinet-container">
          <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#d7b875]">
            Account
          </p>

          <h1 className="mt-3 font-display text-4xl font-black sm:text-5xl">
            Saved Addresses
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
            Save home, work or other delivery locations for faster checkout.
          </p>
        </div>
      </section>

      <section className="sinet-container grid gap-6 py-10 lg:grid-cols-[420px_1fr]">
        <aside className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/10">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            New Address
          </p>

          <h2 className="mt-2 font-display text-2xl font-black text-[#3b1f18]">
            Add delivery address
          </h2>

          <div className="mt-6 space-y-4">
            <select
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none"
            >
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>

            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="w-full rounded-2xl bg-[#3b1f18] px-5 py-3 text-sm font-black text-white"
            >
              Select Location on Map
            </button>

            {selectedLocation && (
              <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4 text-sm">
                <p className="font-black text-[#3b1f18]">
                  {selectedLocation.addressLabel}
                </p>
                <p className="mt-2 text-[#7b6255]">
                  Distance: {Number(selectedLocation.distanceKm || 0).toFixed(2)} km
                </p>
              </div>
            )}

            <input
              value={addressExtra}
              onChange={(event) => setAddressExtra(event.target.value)}
              placeholder="Apartment / floor / door code"
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none"
            />

            <label className="flex items-center gap-3 rounded-2xl border border-[#eadfce] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#3b1f18]">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(event) => setIsDefault(event.target.checked)}
              />
              Set as default address
            </label>

            <button
              type="button"
              onClick={saveAddress}
              disabled={saving || !selectedLocation}
              className="sinet-gold-button w-full disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Address"}
            </button>

            <Link
              href="/account"
              className="block text-center text-sm font-black text-[#3b1f18] underline underline-offset-4"
            >
              Back to account
            </Link>
          </div>
        </aside>

        <section className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
                Addresses
              </p>
              <h2 className="mt-2 font-display text-3xl font-black text-[#3b1f18]">
                Your saved locations
              </h2>
            </div>
          </div>

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

          {loading ? (
            <p className="mt-6 text-sm text-[#7b6255]">Loading addresses...</p>
          ) : addresses.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-10 text-center text-sm text-[#7b6255]">
              No saved address yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {addresses.map((address) => (
                <article
                  key={address.id}
                  className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-xl font-black text-[#3b1f18]">
                        {address.label}
                      </p>

                      {address.isDefault && (
                        <p className="mt-1 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                          Default
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteAddress(address)}
                      disabled={saving}
                      className="text-xs font-black text-red-600"
                    >
                      Delete
                    </button>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-[#7b6255]">
                    {address.addressLabel}
                  </p>

                  {address.addressExtra && (
                    <p className="mt-2 text-sm text-[#7b6255]">
                      {address.addressExtra}
                    </p>
                  )}

                  <p className="mt-3 text-xs font-bold text-[#9c806b]">
                    {address.distanceKm.toFixed(2)} km from restaurant
                  </p>

                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefaultAddress(address)}
                      disabled={saving}
                      className="mt-4 rounded-xl bg-[#3b1f18] px-4 py-2 text-xs font-black text-white"
                    >
                      Set Default
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}