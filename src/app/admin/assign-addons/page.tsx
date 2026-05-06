"use client";

import { useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type AddonGroup = {
  id: string;
  name: string;
  selectionType: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number | null;
  freeChoicesCount: number;
};

type AddonLink = {
  id: string;
  order: number;
  isRequiredOverride: boolean | null;
  minSelectOverride: number | null;
  maxSelectOverride: number | null;
  freeChoicesCountOverride: number | null;
  addonGroup: AddonGroup;
};

type MenuItem = {
  id: string;
  name: string;
  price: string | number;
  status: string;
  category: Category;
  addonGroupLinks: AddonLink[];
};

export default function AssignAddonsPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([]);

  const [selectedItemId, setSelectedItemId] = useState("");
  const [search, setSearch] = useState("");
  const [assignAddonGroupId, setAssignAddonGroupId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/assign-addons", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load data.");
      }

      setMenuItems(data.menuItems);
      setAddonGroups(data.addonGroups);

      if (!selectedItemId && data.menuItems.length > 0) {
        setSelectedItemId(data.menuItems[0].id);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return menuItems;

    return menuItems.filter((item) => {
      return (
        item.name.toLowerCase().includes(value) ||
        item.category?.name?.toLowerCase().includes(value) ||
        item.status.toLowerCase().includes(value)
      );
    });
  }, [menuItems, search]);

  const selectedItem = useMemo(() => {
    return menuItems.find((item) => item.id === selectedItemId) || null;
  }, [menuItems, selectedItemId]);

  const availableAddonGroups = useMemo(() => {
    if (!selectedItem) return addonGroups;

    const assignedIds = new Set(
      selectedItem.addonGroupLinks.map((link) => link.addonGroup.id)
    );

    return addonGroups.filter((group) => !assignedIds.has(group.id));
  }, [addonGroups, selectedItem]);

  function updateLocalLink(
    addonGroupId: string,
    field: keyof AddonLink,
    value: any
  ) {
    if (!selectedItem) return;

    setMenuItems((current) =>
      current.map((item) => {
        if (item.id !== selectedItem.id) return item;

        return {
          ...item,
          addonGroupLinks: item.addonGroupLinks.map((link) =>
            link.addonGroup.id === addonGroupId
              ? { ...link, [field]: value }
              : link
          ),
        };
      })
    );
  }

  async function assignAddonGroup() {
    if (!selectedItem || !assignAddonGroupId) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/assign-addons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuItemId: selectedItem.id,
          addonGroupId: assignAddonGroupId,
          order: selectedItem.addonGroupLinks.length + 1,
          isRequiredOverride: "",
          minSelectOverride: "",
          maxSelectOverride: "",
          freeChoicesCountOverride: "",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to assign addon group.");
      }

      setAssignAddonGroupId("");
      setMessage("Addon group assigned.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to assign addon group.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAddonRule(link: AddonLink) {
    if (!selectedItem) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/assign-addons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuItemId: selectedItem.id,
          addonGroupId: link.addonGroup.id,
          order: link.order,
          isRequiredOverride: link.isRequiredOverride ?? "",
          minSelectOverride: link.minSelectOverride ?? "",
          maxSelectOverride: link.maxSelectOverride ?? "",
          freeChoicesCountOverride: link.freeChoicesCountOverride ?? "",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save addon rule.");
      }

      setMessage("Addon rule saved.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to save addon rule.");
    } finally {
      setSaving(false);
    }
  }

  async function removeAddonRule(link: AddonLink) {
    if (!selectedItem) return;

    const confirmed = window.confirm(
      `Remove "${link.addonGroup.name}" from "${selectedItem.name}"?`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/assign-addons", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuItemId: selectedItem.id,
          addonGroupId: link.addonGroup.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to remove addon rule.");
      }

      setMessage("Addon rule removed.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to remove addon rule.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <section className="border-b border-[#ddcfba] bg-white px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            Admin / Addons
          </p>
          <h1 className="mt-2 font-display text-4xl font-black text-[#3b1f18]">
            Assign Addons
          </h1>
          <p className="mt-2 text-sm text-[#7b6255]">
            Assign addon groups to menu items and set item-specific free choices.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 xl:grid-cols-[420px_1fr]">
        <aside className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/8">
          <div className="mb-5">
            <h2 className="font-display text-2xl font-black text-[#3b1f18]">
              Menu Items
            </h2>
            <p className="mt-1 text-sm text-[#7b6255]">
              Select an item to configure addon rules.
            </p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search item or category..."
            className="mb-4 w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
          />

          {loading ? (
            <p className="rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] px-5 py-8 text-center text-sm text-[#7b6255]">
              Loading items...
            </p>
          ) : filteredItems.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] px-5 py-8 text-center text-sm text-[#7b6255]">
              No items found.
            </p>
          ) : (
            <div className="max-h-[680px] space-y-2 overflow-y-auto pr-1">
              {filteredItems.map((item) => {
                const active = selectedItemId === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-[#3b1f18] bg-[#3b1f18] text-white"
                        : "border-[#eadfce] bg-[#fffaf3] text-[#3b1f18] hover:border-[#c9a45c]"
                    }`}
                  >
                    <p className="font-display text-lg font-black">
                      {item.name}
                    </p>
                    <p
                      className={`mt-1 text-xs font-bold ${
                        active ? "text-white/65" : "text-[#9c806b]"
                      }`}
                    >
                      {item.category?.name || "No category"} · €{" "}
                      {Number(item.price || 0).toFixed(2)}
                    </p>
                    <p
                      className={`mt-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                        active ? "text-[#d7b875]" : "text-[#b09876]"
                      }`}
                    >
                      {item.addonGroupLinks.length} addon group
                      {item.addonGroupLinks.length === 1 ? "" : "s"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="space-y-5">
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

          {!selectedItem ? (
            <div className="rounded-3xl border border-[#e0d3bf] bg-white p-10 text-center text-[#7b6255]">
              Select a menu item to manage addon assignments.
            </div>
          ) : (
            <>
              <div className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
                      Selected Item
                    </p>
                    <h2 className="mt-1 font-display text-3xl font-black text-[#3b1f18]">
                      {selectedItem.name}
                    </h2>
                    <p className="mt-1 text-sm text-[#7b6255]">
                      {selectedItem.category?.name} · €{" "}
                      {Number(selectedItem.price || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f4eee4] px-5 py-3 text-sm font-black text-[#3b1f18]">
                    {selectedItem.addonGroupLinks.length} assigned
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/8">
                <h3 className="font-display text-2xl font-black text-[#3b1f18]">
                  Assign New Addon Group
                </h3>

                <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                  <select
                    value={assignAddonGroupId}
                    onChange={(event) =>
                      setAssignAddonGroupId(event.target.value)
                    }
                    className="rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
                  >
                    <option value="">Select addon group</option>
                    {availableAddonGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={saving || !assignAddonGroupId}
                    onClick={assignAddonGroup}
                    className="sinet-gold-button disabled:opacity-60"
                  >
                    Assign
                  </button>
                </div>

                {availableAddonGroups.length === 0 && (
                  <p className="mt-3 text-sm text-[#7b6255]">
                    All active addon groups are already assigned to this item.
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/8">
                <h3 className="font-display text-2xl font-black text-[#3b1f18]">
                  Assigned Addon Rules
                </h3>

                {selectedItem.addonGroupLinks.length === 0 ? (
                  <p className="mt-5 rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-5 text-sm text-[#7b6255]">
                    No addon groups assigned to this item.
                  </p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {selectedItem.addonGroupLinks.map((link) => (
                      <div
                        key={link.id}
                        className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <h4 className="font-display text-xl font-black text-[#3b1f18]">
                              {link.addonGroup.name}
                            </h4>
                            <p className="mt-1 text-xs font-bold text-[#7b6255]">
                              Default: min {link.addonGroup.minSelect}, max{" "}
                              {link.addonGroup.maxSelect ?? "∞"}, free{" "}
                              {link.addonGroup.freeChoicesCount}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeAddonRule(link)}
                            className="rounded-xl border border-red-200 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-red-600"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-5">
                          <div>
                            <label className="mb-1 block text-xs font-black text-[#7b6255]">
                              Order
                            </label>
                            <input
                              type="number"
                              value={link.order}
                              onChange={(event) =>
                                updateLocalLink(
                                  link.addonGroup.id,
                                  "order",
                                  Number(event.target.value)
                                )
                              }
                              className="w-full rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-black text-[#7b6255]">
                              Min
                            </label>
                            <input
                              type="number"
                              value={link.minSelectOverride ?? ""}
                              onChange={(event) =>
                                updateLocalLink(
                                  link.addonGroup.id,
                                  "minSelectOverride",
                                  event.target.value === ""
                                    ? null
                                    : Number(event.target.value)
                                )
                              }
                              placeholder="Default"
                              className="w-full rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-black text-[#7b6255]">
                              Max
                            </label>
                            <input
                              type="number"
                              value={link.maxSelectOverride ?? ""}
                              onChange={(event) =>
                                updateLocalLink(
                                  link.addonGroup.id,
                                  "maxSelectOverride",
                                  event.target.value === ""
                                    ? null
                                    : Number(event.target.value)
                                )
                              }
                              placeholder="Default"
                              className="w-full rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-black text-[#7b6255]">
                              Free Choices
                            </label>
                            <input
                              type="number"
                              value={link.freeChoicesCountOverride ?? ""}
                              onChange={(event) =>
                                updateLocalLink(
                                  link.addonGroup.id,
                                  "freeChoicesCountOverride",
                                  event.target.value === ""
                                    ? null
                                    : Number(event.target.value)
                                )
                              }
                              placeholder="Default"
                              className="w-full rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-black text-[#7b6255]">
                              Required
                            </label>
                            <select
                              value={
                                link.isRequiredOverride === null
                                  ? ""
                                  : String(link.isRequiredOverride)
                              }
                              onChange={(event) =>
                                updateLocalLink(
                                  link.addonGroup.id,
                                  "isRequiredOverride",
                                  event.target.value === ""
                                    ? null
                                    : event.target.value === "true"
                                )
                              }
                              className="w-full rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                            >
                              <option value="">Default</option>
                              <option value="true">Required</option>
                              <option value="false">Not Required</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => saveAddonRule(link)}
                            disabled={saving}
                            className="rounded-xl bg-[#3b1f18] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                          >
                            Save Rule
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}