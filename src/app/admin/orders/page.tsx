"use client";

import { useEffect, useMemo, useState } from "react";

type AddonSnapshot = {
  id: string;
  groupName: string;
  optionName: string;
  optionPrice: string | number;
};

type OrderItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: string | number;
  addonsTotal: string | number;
  addonSnapshots: AddonSnapshot[];
};

type DeliveryOrder = {
  id: string;
  status: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerNote: string;
  paymentMethod: string;
  addressLabel: string;
  addressExtra: string;
  subtotal: string | number;
  deliveryFee: string | number;
  couponCode: string | null;
  couponDiscount: string | number | null;
  total: string | number;
  items: OrderItem[];
};

const statuses = [
  "pending",
  "accepted",
  "preparing",
  "on_the_way",
  "completed",
  "cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/orders", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load orders.");
      }

      setOrders(data.orders);
    } catch (err: any) {
      setError(err?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const value = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch = value
        ? order.id.toLowerCase().includes(value) ||
          order.customerName.toLowerCase().includes(value) ||
          order.customerPhone.toLowerCase().includes(value) ||
          order.addressLabel.toLowerCase().includes(value) ||
          (order.couponCode || "").toLowerCase().includes(value)
        : true;

      const matchesStatus = statusFilter ? order.status === statusFilter : true;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const allFilteredSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) => selectedIds.includes(order.id));

  function toggleSelectOrder(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  }

  function toggleSelectAllFiltered() {
    if (allFilteredSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !filteredOrders.some((order) => order.id === id))
      );
      return;
    }

    const ids = filteredOrders.map((order) => order.id);
    setSelectedIds((current) => Array.from(new Set([...current, ...ids])));
  }

  async function updateOrderStatus(orderId: string, status: string) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: orderId,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update order.");
      }

      setMessage("Order status updated.");
      await loadOrders();
    } catch (err: any) {
      setError(err?.message || "Failed to update order.");
    } finally {
      setSaving(false);
    }
  }

  async function bulkUpdateStatus() {
    if (selectedIds.length === 0 || !bulkStatus) return;

    const confirmed = window.confirm(
      `Update ${selectedIds.length} selected order(s) to "${bulkStatus}"?`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/orders", {
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
        throw new Error(data.message || "Failed to update selected orders.");
      }

      setMessage("Selected orders updated successfully.");
      setBulkStatus("");
      await loadOrders();
    } catch (err: any) {
      setError(err?.message || "Bulk update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function bulkDeleteOrders() {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected order(s)? This cannot be undone.`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedIds,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete selected orders.");
      }

      setSelectedIds([]);
      setExpandedOrderId(null);
      setMessage("Selected orders deleted successfully.");
      await loadOrders();
    } catch (err: any) {
      setError(err?.message || "Bulk delete failed.");
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

  function money(value: string | number | null | undefined) {
    return `€${Number(value || 0).toFixed(2)}`;
  }

  return (
    <main>
      <section className="border-b border-[#ddcfba] bg-white px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            Admin / Orders
          </p>

          <h1 className="mt-2 font-display text-4xl font-black text-[#3b1f18]">
            Delivery Orders
          </h1>

          <p className="mt-2 text-sm text-[#7b6255]">
            View order details, addon selections and update order status.
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
                Orders
              </h2>
              <p className="mt-1 text-sm text-[#7b6255]">
                {filteredOrders.length} order
                {filteredOrders.length === 1 ? "" : "s"} shown ·{" "}
                {selectedIds.length} selected
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, phone, address, coupon..."
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
                  onClick={bulkDeleteOrders}
                  disabled={saving || selectedIds.length === 0}
                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-black text-red-600 disabled:opacity-50"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-[#7b6255]">Loading orders...</p>
          ) : filteredOrders.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-10 text-center text-sm text-[#7b6255]">
              No orders found.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredOrders.map((order) => {
                const expanded = expandedOrderId === order.id;
                const selected = selectedIds.includes(order.id);

                return (
                  <article
                    key={order.id}
                    className={`rounded-2xl border bg-[#fffaf3] transition ${
                      selected ? "border-[#3b1f18]" : "border-[#eadfce]"
                    }`}
                  >
                    <div className="flex gap-4 p-4">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelectOrder(order.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-2"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOrderId(expanded ? null : order.id)
                        }
                        className="grid flex-1 gap-4 text-left lg:grid-cols-[1fr_180px_150px_120px]"
                      >
                        <div>
                          <p className="font-display text-xl font-black text-[#3b1f18]">
                            {order.customerName}
                          </p>
                          <p className="mt-1 text-sm text-[#7b6255]">
                            {order.customerPhone} ·{" "}
                            {formatDate(order.createdAt)}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs font-bold text-[#9c806b]">
                            {order.addressLabel}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b09876]">
                            Order ID
                          </p>
                          <p className="mt-1 truncate text-sm font-bold text-[#3b1f18]">
                            {order.id}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b09876]">
                            Status
                          </p>
                          <p className="mt-1 rounded-full bg-white px-3 py-1 text-center text-sm font-black text-[#3b1f18]">
                            {order.status}
                          </p>
                        </div>

                        <div className="text-right lg:text-left">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#b09876]">
                            Total
                          </p>

                          {order.couponCode && (
                            <p className="mt-1 text-xs font-black text-green-700">
                              Coupon: {order.couponCode}
                            </p>
                          )}

                          <p className="mt-1 font-display text-2xl font-black text-[#3b1f18]">
                            {money(order.total)}
                          </p>
                        </div>
                      </button>
                    </div>

                    {expanded && (
                      <div className="border-t border-[#eadfce] p-4">
                        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                          <div>
                            <h3 className="font-display text-xl font-black text-[#3b1f18]">
                              Items
                            </h3>

                            <div className="mt-4 space-y-3">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-2xl bg-white p-4"
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
                                              <strong>
                                                {addon.optionName}
                                              </strong>
                                            </span>
                                            <span className="font-bold">
                                              {money(addon.optionPrice)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <aside className="rounded-2xl bg-white p-5">
                            <h3 className="font-display text-xl font-black text-[#3b1f18]">
                              Customer
                            </h3>

                            <div className="mt-4 space-y-3 text-sm text-[#7b6255]">
                              <p>
                                <strong>Name:</strong> {order.customerName}
                              </p>
                              <p>
                                <strong>Phone:</strong> {order.customerPhone}
                              </p>
                              <p>
                                <strong>Address:</strong> {order.addressLabel}
                              </p>
                              {order.addressExtra && (
                                <p>
                                  <strong>Extra:</strong> {order.addressExtra}
                                </p>
                              )}
                              {order.customerNote && (
                                <p>
                                  <strong>Note:</strong> {order.customerNote}
                                </p>
                              )}
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

                              {order.couponCode && (
                                <div className="mt-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
                                  <div className="flex justify-between text-sm text-green-800">
                                    <span>Coupon ({order.couponCode})</span>
                                    <strong>
                                      -{money(order.couponDiscount)}
                                    </strong>
                                  </div>
                                </div>
                              )}

                              <div className="mt-3 flex justify-between font-display text-2xl font-black text-[#3b1f18]">
                                <span>Total</span>
                                <span>{money(order.total)}</span>
                              </div>
                            </div>

                            <div className="mt-5">
                              <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                                Update Status
                              </label>

                              <select
                                value={order.status}
                                disabled={saving}
                                onChange={(event) =>
                                  updateOrderStatus(order.id, event.target.value)
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