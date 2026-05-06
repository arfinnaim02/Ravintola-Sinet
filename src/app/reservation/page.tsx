"use client";

import { useEffect, useMemo, useState } from "react";
import ReservationItemPreviewModal, {
  ReservationSelectedItem,
} from "../../components/ReservationItemPreviewModal";
import { useLanguage } from "../../i18n/LanguageContext";

type CategoryFromApi = {
  id: string;
  name: string;
  slug: string;
};

type MenuItemFromApi = {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  image: string | null;
  status?: string;
  category?: CategoryFromApi | null;
};

const timeSlots = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReservationPage() {
  const { t } = useLanguage();

  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [babySeats, setBabySeats] = useState(0);
  const [preferredTable, setPreferredTable] = useState("");

  const [menuItems, setMenuItems] = useState<MenuItemFromApi[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuPopupOpen, setMenuPopupOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<ReservationSelectedItem[]>(
    []
  );
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [reservationId, setReservationId] = useState("");

  useEffect(() => {
    async function loadMenu() {
      setMenuLoading(true);

      try {
        const response = await fetch("/api/menu", { cache: "no-store" });
        const data = await response.json();

        setMenuItems(Array.isArray(data) ? data : []);
      } catch {
        setMenuItems([]);
      } finally {
        setMenuLoading(false);
      }
    }

    loadMenu();
  }, []);

  const tablesNeeded = useMemo(() => {
    return Math.max(1, Math.ceil(partySize / 4));
  }, [partySize]);

  const selectedItemsTotal = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.qty,
      0
    );
  }, [selectedItems]);

  const filteredMenuItems = useMemo(() => {
    const value = menuSearch.trim().toLowerCase();

    if (!value) return menuItems;

    return menuItems.filter((item) => {
      return (
        item.name.toLowerCase().includes(value) ||
        item.description?.toLowerCase().includes(value) ||
        item.category?.name?.toLowerCase().includes(value)
      );
    });
  }, [menuItems, menuSearch]);

  function openReservationPreview(itemId: string) {
    setPreviewItemId(itemId);
    setPreviewOpen(true);
  }

  function addReservationItem(item: ReservationSelectedItem) {
    setSelectedItems((current) => {
      const existing = current.find(
        (selected) => selected.reservationKey === item.reservationKey
      );

      if (existing) {
        return current.map((selected) =>
          selected.reservationKey === item.reservationKey
            ? { ...selected, qty: selected.qty + 1 }
            : selected
        );
      }

      return [...current, item];
    });
  }

  function updateReservationItemQty(reservationKey: string, qty: number) {
    if (qty <= 0) {
      setSelectedItems((current) =>
        current.filter((item) => item.reservationKey !== reservationKey)
      );
      return;
    }

    setSelectedItems((current) =>
      current.map((item) =>
        item.reservationKey === reservationKey ? { ...item, qty } : item
      )
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!time) {
      setStatus(t("reservationSelectTimeError"));
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);
    setStatus("");
    setReservationId("");

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          time,
          name: formData.get("name"),
          phone: formData.get("phone"),
          email: formData.get("email"),
          partySize,
          babySeats,
          preferredTable,
          notes: formData.get("notes"),
          items: selectedItems.map((item) => ({
            id: item.id,
            qty: item.qty,
            unitPrice: item.unitPrice,
            addonsTotal: item.addonsTotal,
            addons: item.addons,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || t("reservationFailed"));
      }

      setStatus(t("reservationSuccess"));
      setReservationId(data.reservation.id);
      form.reset();
      setTime("");
      setPartySize(2);
      setBabySeats(0);
      setPreferredTable("");
      setSelectedItems([]);
    } catch (error: any) {
      setStatus(error?.message || t("reservationFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4eee4]">
      {menuPopupOpen && (
        <div className="fixed inset-0 z-[120] bg-black/65">
          <div className="flex h-dvh w-full items-end justify-center sm:items-center sm:p-4">
            <div className="flex h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-[#f4eee4] shadow-2xl sm:h-[90vh] sm:rounded-3xl">
              <div className="shrink-0 border-b border-[#ddcfba] bg-white px-4 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.32em] text-[#b09876]">
                      {t("reservationMenu")}
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-black text-[#3b1f18] sm:text-3xl">
                      {t("selectItemsForReservation")}
                    </h2>
                    <p className="mt-2 text-xs leading-5 text-[#7b6255] sm:text-sm">
                      {t("reservationMenuSubtitle")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMenuPopupOpen(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8c9ac] text-2xl text-[#3b1f18]"
                  >
                    ×
                  </button>
                </div>

                <input
                  value={menuSearch}
                  onChange={(event) => setMenuSearch(event.target.value)}
                  placeholder={t("searchMenuPlaceholder")}
                  className="mt-4 w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm font-bold outline-none focus:border-[#c9a45c]"
                />
              </div>

              <div className="grid min-h-0 flex-1 md:grid-cols-[1fr_340px]">
                <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
                  {menuLoading ? (
                    <p className="text-sm text-[#7b6255]">
                      {t("loadingMenu")}
                    </p>
                  ) : filteredMenuItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#d8c9ac] bg-white p-10 text-center text-sm text-[#7b6255]">
                      {t("noMenuItemsFound")}
                    </div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {filteredMenuItems.map((item) => (
                        <article
                          key={item.id}
                          className="rounded-2xl border border-[#eadfce] bg-white p-3 shadow-sm"
                        >
                          <div className="flex gap-4">
                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#eadcc6]">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <span className="font-script text-3xl text-[#3b1f18]/50">
                                    Sinet
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#b09876]">
                                {item.category?.name || t("navMenu")}
                              </p>
                              <h3 className="mt-1 font-display text-lg font-black text-[#3b1f18]">
                                {item.name}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#7b6255]">
                                {item.description || t("freshlyPreparedShort")}
                              </p>

                              <div className="mt-3 flex items-center justify-between gap-3">
                                <span className="font-black text-[#3b1f18]">
                                  €{Number(item.price || 0).toFixed(2)}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openReservationPreview(item.id)
                                  }
                                  className="rounded-xl bg-[#3b1f18] px-4 py-2 text-xs font-black text-white"
                                >
                                  {t("customize")}
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                <aside className="flex min-h-0 flex-col border-t border-[#ddcfba] bg-white p-4 md:border-l md:border-t-0 sm:p-6">
                  <h3 className="font-display text-2xl font-black text-[#3b1f18]">
                    {t("selectedItems")}
                  </h3>

                  <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
                    {selectedItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-6 text-center text-sm text-[#7b6255]">
                        {t("noItemsSelected")}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedItems.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-3"
                          >
                            <div className="flex justify-between gap-3">
                              <div>
                                <p className="font-black text-[#3b1f18]">
                                  {item.name}
                                </p>
                                <p className="mt-1 text-xs text-[#7b6255]">
                                  €{item.unitPrice.toFixed(2)} {t("each")}
                                </p>

                                {item.addons.length > 0 && (
                                  <div className="mt-2 space-y-1 rounded-xl bg-white px-3 py-2">
                                    {item.addons.map((addon) => (
                                      <div
                                        key={`${item.reservationKey}-${addon.optionId}`}
                                        className="flex justify-between gap-3 text-[11px] text-[#7b6255]"
                                      >
                                        <span>
                                          {addon.groupName}:{" "}
                                          <strong>{addon.optionName}</strong>
                                        </span>

                                        <span className="font-bold">
                                          {addon.optionPrice > 0
                                            ? `+€${addon.optionPrice.toFixed(2)}`
                                            : t("free")}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  updateReservationItemQty(
                                    item.reservationKey,
                                    0
                                  )
                                }
                                className="text-xs font-black text-red-600"
                              >
                                {t("remove")}
                              </button>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateReservationItemQty(
                                      item.reservationKey,
                                      item.qty - 1
                                    )
                                  }
                                  className="h-8 w-8 rounded-full bg-white text-lg font-black"
                                >
                                  −
                                </button>

                                <span className="w-8 text-center font-black">
                                  {item.qty}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateReservationItemQty(
                                      item.reservationKey,
                                      item.qty + 1
                                    )
                                  }
                                  className="h-8 w-8 rounded-full bg-white text-lg font-black"
                                >
                                  +
                                </button>
                              </div>

                              <strong className="text-[#3b1f18]">
                                €{(item.unitPrice * item.qty).toFixed(2)}
                              </strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-[#eadfce] pt-4">
                    <div className="flex justify-between font-display text-xl font-black text-[#3b1f18]">
                      <span>{t("total")}</span>
                      <span>€{selectedItemsTotal.toFixed(2)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMenuPopupOpen(false)}
                      className="sinet-gold-button mt-4 w-full"
                    >
                      {t("done")}
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="bg-[#1b0e0a] px-4 py-16 text-center text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#d7b875] sm:text-xs">
          Ravintola Sinet
        </p>

        <h1 className="mt-4 font-script text-[78px] leading-none sm:text-[112px]">
          {t("reservation")}
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
          {t("reservationHeroText")}
        </p>
      </section>

      <section className="sinet-container grid gap-8 py-10 lg:grid-cols-[0.85fr_1.15fr] lg:py-14">
        <aside className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/10">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            {t("bookingDetails")}
          </p>

          <h2 className="mt-2 font-display text-3xl font-black text-[#3b1f18]">
            {t("chooseDateTime")}
          </h2>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                {t("date")}
              </label>
              <input
                type="date"
                min={todayDate()}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-black text-[#3b1f18]">
                {t("time")}
              </label>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`rounded-xl border px-3 py-3 text-sm font-black transition ${
                      time === slot
                        ? "border-[#3b1f18] bg-[#3b1f18] text-white"
                        : "border-[#d8c9ac] bg-[#fffaf3] text-[#3b1f18] hover:border-[#c9a45c]"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[#fffaf3] p-4">
              <div className="flex justify-between text-sm">
                <span>{t("guests")}</span>
                <strong>{partySize}</strong>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span>{t("estimatedTables")}</span>
                <strong>{tablesNeeded}</strong>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span>{t("selectedTime")}</span>
                <strong>{time || t("notSelected")}</strong>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span>{t("reservedItems")}</span>
                <strong>{selectedItems.length}</strong>
              </div>

              <div className="mt-2 flex justify-between border-t border-[#eadfce] pt-3 text-sm">
                <span>{t("itemsTotal")}</span>
                <strong>€{selectedItemsTotal.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </aside>

        <section className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/10">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            {t("customerInformation")}
          </p>

          <h2 className="mt-2 font-display text-3xl font-black text-[#3b1f18]">
            {t("requestTable")}
          </h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                name="name"
                required
                placeholder={t("name")}
                className="rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
              />

              <input
                name="phone"
                required
                placeholder={t("phone")}
                className="rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
              />

              <input
                name="email"
                type="email"
                placeholder={t("email")}
                className="rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
              />

              <select
                value={preferredTable}
                onChange={(event) => setPreferredTable(event.target.value)}
                className="rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
              >
                <option value="">{t("preferredTableOptional")}</option>
                <option value="1">{t("table")} 1</option>
                <option value="2">{t("table")} 2</option>
                <option value="3">{t("table")} 3</option>
                <option value="4">{t("table")} 4</option>
                <option value="5">{t("table")} 5</option>
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                  {t("guests")}
                </label>
                <div className="flex items-center justify-between rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPartySize((value) => Math.max(1, value - 1))
                    }
                    className="h-9 w-9 rounded-full bg-white text-xl font-black"
                  >
                    −
                  </button>

                  <span className="font-black text-[#3b1f18]">
                    {partySize}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPartySize((value) => Math.min(30, value + 1))
                    }
                    className="h-9 w-9 rounded-full bg-white text-xl font-black"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                  {t("babySeats")}
                </label>
                <div className="flex items-center justify-between rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setBabySeats((value) => Math.max(0, value - 1))
                    }
                    className="h-9 w-9 rounded-full bg-white text-xl font-black"
                  >
                    −
                  </button>

                  <span className="font-black text-[#3b1f18]">
                    {babySeats}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setBabySeats((value) => Math.min(10, value + 1))
                    }
                    className="h-9 w-9 rounded-full bg-white text-xl font-black"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-xl font-black text-[#3b1f18]">
                    {t("reservationItems")}
                  </p>
                  <p className="mt-1 text-sm text-[#7b6255]">
                    {selectedItems.length === 0
                      ? t("noFoodItemsSelected")
                      : `${selectedItems.length} ${t("itemTypesSelected")}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuPopupOpen(true)}
                  className="rounded-2xl bg-[#3b1f18] px-5 py-3 text-sm font-black text-white"
                >
                  {t("selectItems")}
                </button>
              </div>

              {selectedItems.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <span className="font-bold">
                          {item.name} × {item.qty}
                        </span>

                        {item.addons.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {item.addons.map((addon) => (
                              <p
                                key={`${item.reservationKey}-${addon.optionId}`}
                                className="text-[11px] text-[#7b6255]"
                              >
                                {addon.groupName}: {addon.optionName}
                                {addon.optionPrice > 0
                                  ? ` (+€${addon.optionPrice.toFixed(2)})`
                                  : ` (${t("free")})`}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <strong className="shrink-0">
                        €{(item.unitPrice * item.qty).toFixed(2)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <textarea
              name="notes"
              placeholder={t("reservationNotesPlaceholder")}
              className="min-h-28 w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
            />

            <button
              type="submit"
              disabled={loading}
              className="sinet-gold-button w-full disabled:opacity-60"
            >
              {loading ? t("submitting") : t("submitReservationRequest")}
            </button>

            {status && (
              <div
                className={`rounded-2xl px-5 py-4 text-sm font-bold ${
                  reservationId
                    ? "border border-green-200 bg-green-50 text-green-800"
                    : "border border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <p>{status}</p>
                {reservationId && (
                  <p className="mt-1">
                    {t("reservationId")}: {reservationId}
                  </p>
                )}
              </div>
            )}
          </form>
        </section>
      </section>

      <ReservationItemPreviewModal
        itemId={previewItemId}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onAdd={addReservationItem}
      />
    </main>
  );
}