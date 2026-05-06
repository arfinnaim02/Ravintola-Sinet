"use client";

import { useEffect, useMemo, useState } from "react";

type ReservationAddon = {
  id: string;
  groupName: string;
  optionName: string;
  optionPrice: string | number;
};

type ReservationItem = {
  id: string;
  qty: number;
  unitPrice: string | number;
  addonsTotal: string | number;
  menuItem: {
    id: string;
    name: string;
    image: string | null;
  };
  addonSnapshots: ReservationAddon[];
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

const statuses = ["pending", "accepted", "completed", "cancelled"];

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadReservations() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/reservations", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load reservations.");
      }

      setReservations(data.reservations);
    } catch (err: any) {
      setError(err?.message || "Failed to load reservations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReservations();
  }, []);

  const filteredReservations = useMemo(() => {
    const value = search.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const matchesSearch = value
        ? reservation.id.toLowerCase().includes(value) ||
          reservation.name.toLowerCase().includes(value) ||
          reservation.phone.toLowerCase().includes(value) ||
          reservation.email.toLowerCase().includes(value)
        : true;

      const matchesStatus = statusFilter
        ? reservation.status === statusFilter
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [reservations, search, statusFilter]);

  const allFilteredSelected =
    filteredReservations.length > 0 &&
    filteredReservations.every((reservation) =>
      selectedIds.includes(reservation.id)
    );

  function toggleSelectReservation(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  }

  function toggleSelectAllFiltered() {
    if (allFilteredSelected) {
      setSelectedIds((current) =>
        current.filter(
          (id) =>
            !filteredReservations.some((reservation) => reservation.id === id)
        )
      );
      return;
    }

    const ids = filteredReservations.map((reservation) => reservation.id);
    setSelectedIds((current) => Array.from(new Set([...current, ...ids])));
  }

  async function updateReservationStatus(id: string, status: string) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update reservation.");
      }

      setMessage("Reservation status updated.");
      await loadReservations();
    } catch (err: any) {
      setError(err?.message || "Failed to update reservation.");
    } finally {
      setSaving(false);
    }
  }

  async function bulkUpdateStatus() {
    if (selectedIds.length === 0 || !bulkStatus) return;

    const confirmed = window.confirm(
      `Update ${selectedIds.length} selected reservation(s) to "${bulkStatus}"?`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedIds,
          status: bulkStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update selected reservations.");
      }

      setMessage("Selected reservations updated.");
      setBulkStatus("");
      await loadReservations();
    } catch (err: any) {
      setError(err?.message || "Bulk update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteReservation(id: string) {
    const confirmed = window.confirm("Delete this reservation?");
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/reservations", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete reservation.");
      }

      setMessage("Reservation deleted.");
      setExpandedId(null);
      await loadReservations();
    } catch (err: any) {
      setError(err?.message || "Failed to delete reservation.");
    } finally {
      setSaving(false);
    }
  }

  async function bulkDeleteReservations() {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected reservation(s)? This cannot be undone.`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/reservations", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete selected reservations.");
      }

      setSelectedIds([]);
      setExpandedId(null);
      setMessage("Selected reservations deleted.");
      await loadReservations();
    } catch (err: any) {
      setError(err?.message || "Bulk delete failed.");
    } finally {
      setSaving(false);
    }
  }

  function money(value: string | number) {
    return `€${Number(value || 0).toFixed(2)}`;
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  function reservationItemsTotal(items: ReservationItem[]) {
    return items.reduce(
      (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.qty || 1),
      0
    );
  }

  function statusClass(status: string) {
    if (status === "accepted") return "bg-green-50 text-green-700";
    if (status === "completed") return "bg-blue-50 text-blue-700";
    if (status === "cancelled") return "bg-red-50 text-red-700";
    return "bg-yellow-50 text-yellow-700";
  }

  return (
    <main>
      <section className="border-b border-[#ddcfba] bg-white px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            Admin / Reservations
          </p>

          <h1 className="mt-2 font-display text-4xl font-black text-[#3b1f18]">
            Table Reservations
          </h1>

          <p className="mt-2 text-sm text-[#7b6255]">
            Manage reservation requests, selected food items, addons and booking status.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        {message && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-2xl font-black text-[#3b1f18]">
                Reservations
              </h2>
              <p className="mt-1 text-sm text-[#7b6255]">
                {filteredReservations.length} reservation
                {filteredReservations.length === 1 ? "" : "s"} shown ·{" "}
                {selectedIds.length} selected
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, phone, email..."
                className="rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
              >
                <option value="">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <label className="flex items-center gap-3 text-sm font-black text-[#3b1f18]">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                />
                Select all filtered
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={bulkStatus}
                  onChange={(event) => setBulkStatus(event.target.value)}
                  className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                >
                  <option value="">Bulk status</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      Set {status}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={bulkUpdateStatus}
                  disabled={saving || selectedIds.length === 0 || !bulkStatus}
                  className="rounded-xl bg-[#3b1f18] px-4 py-2 text-sm font-black text-white disabled:opacity-50"
                >
                  Apply Status
                </button>

                <button
                  type="button"
                  onClick={bulkDeleteReservations}
                  disabled={saving || selectedIds.length === 0}
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-black text-red-600 disabled:opacity-50"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-[#7b6255]">Loading reservations...</p>
          ) : filteredReservations.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-10 text-center text-sm text-[#7b6255]">
              No reservations found.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredReservations.map((reservation) => {
                const expanded = expandedId === reservation.id;
                const selected = selectedIds.includes(reservation.id);
                const itemTotal = reservationItemsTotal(reservation.items);

                return (
                  <article
                    key={reservation.id}
                    className={`rounded-2xl border bg-[#fffaf3] transition ${
                      selected ? "border-[#3b1f18]" : "border-[#eadfce]"
                    }`}
                  >
                    <div className="flex gap-4 p-4">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelectReservation(reservation.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-2"
                      />

                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : reservation.id)}
                        className="grid flex-1 gap-4 text-left lg:grid-cols-[1fr_170px_150px_120px]"
                      >
                        <div>
                          <p className="font-display text-xl font-black text-[#3b1f18]">
                            {reservation.name}
                          </p>
                          <p className="mt-1 text-sm text-[#7b6255]">
                            {reservation.phone} · {formatDate(reservation.startDatetime)}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#9c806b]">
                            Guests: {reservation.partySize} · Tables:{" "}
                            {reservation.tablesNeeded}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b09876]">
                            Reservation ID
                          </p>
                          <p className="mt-1 truncate text-sm font-bold text-[#3b1f18]">
                            {reservation.id}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b09876]">
                            Status
                          </p>
                          <p
                            className={`mt-1 rounded-full px-3 py-1 text-center text-sm font-black ${statusClass(
                              reservation.status
                            )}`}
                          >
                            {reservation.status}
                          </p>
                        </div>

                        <div className="text-right lg:text-left">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b09876]">
                            Items
                          </p>
                          <p className="mt-1 font-display text-2xl font-black text-[#3b1f18]">
                            {money(itemTotal)}
                          </p>
                        </div>
                      </button>
                    </div>

                    {expanded && (
                      <div className="border-t border-[#eadfce] p-4">
                        <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
                          <div>
                            <h3 className="font-display text-xl font-black text-[#3b1f18]">
                              Reserved Items
                            </h3>

                            {reservation.items.length === 0 ? (
                              <div className="mt-4 rounded-2xl border border-dashed border-[#d8c9ac] bg-white p-8 text-center text-sm text-[#7b6255]">
                                No food items selected.
                              </div>
                            ) : (
                              <div className="mt-4 space-y-3">
                                {reservation.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="rounded-2xl bg-white p-4"
                                  >
                                    <div className="flex justify-between gap-4">
                                      <div>
                                        <p className="font-black text-[#3b1f18]">
                                          {item.menuItem?.name || "Deleted item"} ×{" "}
                                          {item.qty}
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
                                      <div className="mt-3 rounded-xl bg-[#fffaf3] px-3 py-2">
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
                            )}
                          </div>

                          <aside className="rounded-2xl bg-white p-5">
                            <h3 className="font-display text-xl font-black text-[#3b1f18]">
                              Customer
                            </h3>

                            <div className="mt-4 space-y-3 text-sm text-[#7b6255]">
                              <p>
                                <strong>Name:</strong> {reservation.name}
                              </p>
                              <p>
                                <strong>Phone:</strong> {reservation.phone}
                              </p>
                              {reservation.email && (
                                <p>
                                  <strong>Email:</strong> {reservation.email}
                                </p>
                              )}
                              <p>
                                <strong>Date:</strong>{" "}
                                {formatDate(reservation.startDatetime)}
                              </p>
                              <p>
                                <strong>Guests:</strong> {reservation.partySize}
                              </p>
                              <p>
                                <strong>Baby seats:</strong>{" "}
                                {reservation.babySeats}
                              </p>
                              <p>
                                <strong>Tables needed:</strong>{" "}
                                {reservation.tablesNeeded}
                              </p>
                              {reservation.preferredTable && (
                                <p>
                                  <strong>Preferred table:</strong>{" "}
                                  {reservation.preferredTable}
                                </p>
                              )}
                              {reservation.notes && (
                                <p>
                                  <strong>Notes:</strong> {reservation.notes}
                                </p>
                              )}
                            </div>

                            <div className="mt-5 border-t border-[#eadfce] pt-4">
                              <div className="flex justify-between text-sm">
                                <span>Reserved items total</span>
                                <strong>{money(itemTotal)}</strong>
                              </div>
                            </div>

                            <div className="mt-5">
                              <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                                Update Status
                              </label>

                              <select
                                value={reservation.status}
                                disabled={saving}
                                onChange={(event) =>
                                  updateReservationStatus(
                                    reservation.id,
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-xl border border-[#d8c9ac] bg-[#fffaf3] px-3 py-3 text-sm"
                              >
                                {statuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => deleteReservation(reservation.id)}
                              disabled={saving}
                              className="mt-4 w-full rounded-xl border border-red-200 px-4 py-2 text-sm font-black text-red-600 disabled:opacity-50"
                            >
                              Delete Reservation
                            </button>
                          </aside>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}