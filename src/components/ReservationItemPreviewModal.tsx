"use client";

import { useEffect, useMemo, useState } from "react";

type AddonOption = {
  id: string;
  name: string;
  price: string | number;
};

type AddonGroup = {
  id: string;
  name: string;
  selectionType: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number | null;
  freeChoicesCount: number;
  options: AddonOption[];
};

type AddonGroupLink = {
  id: string;
  order: number;
  isRequiredOverride: boolean | null;
  minSelectOverride: number | null;
  maxSelectOverride: number | null;
  freeChoicesCountOverride: number | null;
  addonGroup: AddonGroup;
};

type MenuItemDetails = {
  id: string;
  name: string;
  description: string;
  price: string | number;
  image: string | null;
  category?: {
    name: string;
    slug: string;
  } | null;
  addonGroupLinks: AddonGroupLink[];
};

export type ReservationSelectedAddon = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  optionPrice: number;
};

export type ReservationSelectedItem = {
  reservationKey: string;
  id: string;
  name: string;
  image: string;
  basePrice: number;
  unitPrice: number;
  addonsTotal: number;
  qty: number;
  addons: ReservationSelectedAddon[];
};

type Props = {
  itemId: string | null;
  open: boolean;
  onClose: () => void;
  onAdd: (item: ReservationSelectedItem) => void;
};

function getEffectiveRules(link: AddonGroupLink) {
  const group = link.addonGroup;

  return {
    isRequired: link.isRequiredOverride ?? group.isRequired,
    minSelect: link.minSelectOverride ?? group.minSelect,
    maxSelect: link.maxSelectOverride ?? group.maxSelect,
    freeChoicesCount:
      link.freeChoicesCountOverride ?? group.freeChoicesCount ?? 0,
  };
}

function createReservationKey(itemId: string, addons: ReservationSelectedAddon[]) {
  const addonKey = addons
    .map((addon) => addon.optionId)
    .sort()
    .join("-");

  return addonKey ? `${itemId}-${addonKey}` : itemId;
}

export default function ReservationItemPreviewModal({
  itemId,
  open,
  onClose,
  onAdd,
}: Props) {
  const [item, setItem] = useState<MenuItemDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, AddonOption[]>
  >({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !itemId) return;

    async function fetchItem() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/menu/${itemId}`, { cache: "no-store" });

        if (!res.ok) {
          throw new Error("Failed to load item.");
        }

        const data = await res.json();
        setItem(data);
        setSelectedOptions({});
      } catch (err: any) {
        setError(err?.message || "Failed to load item.");
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [itemId, open]);

  const basePrice = Number(item?.price || 0);

  const selectedAddons = useMemo(() => {
    if (!item) return [];

    const addons: ReservationSelectedAddon[] = [];

    item.addonGroupLinks.forEach((link) => {
      const selected = selectedOptions[link.addonGroup.id] || [];
      const { freeChoicesCount } = getEffectiveRules(link);

      selected.forEach((option, index) => {
        const originalPrice = Number(option.price || 0);
        const isFree = index < freeChoicesCount;

        addons.push({
          groupId: link.addonGroup.id,
          groupName: link.addonGroup.name,
          optionId: option.id,
          optionName: isFree ? `${option.name} (Free)` : option.name,
          optionPrice: isFree ? 0 : originalPrice,
        });
      });
    });

    return addons;
  }, [item, selectedOptions]);

  const addonsTotal = selectedAddons.reduce(
    (sum, addon) => sum + Number(addon.optionPrice || 0),
    0
  );

  const totalPrice = basePrice + addonsTotal;

  function toggleOption(link: AddonGroupLink, option: AddonOption) {
    const group = link.addonGroup;
    const { maxSelect } = getEffectiveRules(link);

    setSelectedOptions((current) => {
      const existing = current[group.id] || [];
      const alreadySelected = existing.some((item) => item.id === option.id);

      if (group.selectionType === "single") {
        return {
          ...current,
          [group.id]: alreadySelected ? [] : [option],
        };
      }

      if (alreadySelected) {
        return {
          ...current,
          [group.id]: existing.filter((item) => item.id !== option.id),
        };
      }

      if (maxSelect && existing.length >= maxSelect) {
        return current;
      }

      return {
        ...current,
        [group.id]: [...existing, option],
      };
    });
  }

  function validateSelections() {
    if (!item) return false;

    for (const link of item.addonGroupLinks) {
      const selected = selectedOptions[link.addonGroup.id] || [];
      const rules = getEffectiveRules(link);

      if (rules.isRequired && selected.length === 0) {
        setError(`Please choose an option from "${link.addonGroup.name}".`);
        return false;
      }

      if (rules.minSelect > 0 && selected.length < rules.minSelect) {
        setError(
          `Please choose at least ${rules.minSelect} option(s) from "${link.addonGroup.name}".`
        );
        return false;
      }
    }

    setError("");
    return true;
  }

  function handleAdd() {
    if (!item) return;

    const valid = validateSelections();
    if (!valid) return;

    const reservationKey = createReservationKey(item.id, selectedAddons);

    onAdd({
      reservationKey,
      id: item.id,
      name: item.name,
      image: item.image || "",
      basePrice,
      unitPrice: totalPrice,
      addonsTotal,
      qty: 1,
      addons: selectedAddons,
    });

    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="max-h-[94dvh] w-full max-w-3xl overflow-hidden rounded-t-3xl bg-[#f4eee4] shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[#ddcfba] bg-[#3b1f18] px-5 py-4 text-white">
          <h2 className="font-display text-xl font-black">Select Item</h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-2xl"
          >
            ×
          </button>
        </div>

        {loading || !item ? (
          <div className="p-10 text-center text-[#7b6255]">
            {error || "Loading item..."}
          </div>
        ) : (
          <div className="max-h-[calc(94dvh-76px)] overflow-y-auto">
            <div className="grid gap-6 p-5 sm:grid-cols-[240px_1fr] sm:p-7">
              <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-56 w-full object-cover sm:h-full"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-[#eadcc6]">
                    <span className="font-script text-6xl text-[#3b1f18]/50">
                      Sinet
                    </span>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#b09876]">
                  {item.category?.name || "Menu"}
                </p>

                <h3 className="mt-2 font-display text-3xl font-black text-[#3b1f18]">
                  {item.name}
                </h3>

                <p className="mt-4 text-sm leading-7 text-[#7b6255]">
                  {item.description || "Freshly prepared and served with care."}
                </p>

                <p className="mt-5 text-2xl font-black text-[#3b1f18]">
                  € {basePrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-5 px-5 pb-6 sm:px-7">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              {item.addonGroupLinks.length === 0 ? (
                <div className="rounded-2xl border border-[#e0d3bf] bg-white p-5 text-sm text-[#7b6255]">
                  No addons available for this item.
                </div>
              ) : (
                item.addonGroupLinks.map((link) => {
                  const group = link.addonGroup;
                  const selected = selectedOptions[group.id] || [];
                  const rules = getEffectiveRules(link);

                  return (
                    <div
                      key={link.id}
                      className="rounded-2xl border border-[#e0d3bf] bg-white p-5 shadow-sm"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-display text-xl font-black text-[#3b1f18]">
                            {group.name}
                          </h4>

                          <p className="mt-1 text-xs font-semibold text-[#9c806b]">
                            {group.selectionType === "single"
                              ? "Choose one option"
                              : `Choose up to ${
                                  rules.maxSelect || "multiple"
                                } options`}
                          </p>

                          {rules.freeChoicesCount > 0 && (
                            <p className="mt-2 rounded-full bg-[#f4eee4] px-3 py-1 text-xs font-black text-[#3b1f18]">
                              First {rules.freeChoicesCount} choice
                              {rules.freeChoicesCount === 1 ? "" : "s"} free
                            </p>
                          )}
                        </div>

                        {rules.isRequired && (
                          <span className="rounded-full bg-[#3b1f18] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                            Required
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {group.options.map((option) => {
                          const selectedIndex = selected.findIndex(
                            (selectedOption) => selectedOption.id === option.id
                          );

                          const checked = selectedIndex !== -1;
                          const originalPrice = Number(option.price || 0);
                          const isFree =
                            checked && selectedIndex < rules.freeChoicesCount;

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => toggleOption(link, option)}
                              className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${
                                checked
                                  ? "border-[#3b1f18] bg-[#f8f2e8]"
                                  : "border-[#eadfce] bg-white hover:border-[#c9a45c]"
                              }`}
                            >
                              <span className="font-semibold text-[#3b1f18]">
                                {option.name}
                              </span>

                              <span className="shrink-0 font-black text-[#3b1f18]">
                                {isFree ? (
                                  <span className="text-green-700">Free</span>
                                ) : originalPrice > 0 ? (
                                  <>+ € {originalPrice.toFixed(2)}</>
                                ) : (
                                  "Free"
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="sticky bottom-0 border-t border-[#ddcfba] bg-[#f4eee4]/95 p-5 backdrop-blur">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-bold text-[#7b6255]">Base</span>
                <span className="font-black text-[#3b1f18]">
                  € {basePrice.toFixed(2)}
                </span>
              </div>

              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="font-bold text-[#7b6255]">Addons</span>
                <span className="font-black text-[#3b1f18]">
                  € {addonsTotal.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                className="sinet-gold-button w-full"
              >
                Add to Reservation — € {totalPrice.toFixed(2)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}