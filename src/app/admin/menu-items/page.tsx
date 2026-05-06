"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
};

type AddonGroup = {
  id: string;
  name: string;
};

type AddonLink = {
  id: string;
  addonGroup: AddonGroup;
};

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string | number;
  image: string | null;
  tags: string;
  allergens: string;
  status: string;
  categoryId: string;
  category: Category;
  addonGroupLinks: AddonLink[];
};

const emptyItem = {
  name: "",
  categoryId: "",
  price: "",
  description: "",
  tags: "",
  allergens: "",
  status: "active",
  imageFile: null as File | null,
};

export default function AdminMenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newItem, setNewItem] = useState(emptyItem);
  const [search, setSearch] = useState("");

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");

  const [editingFiles, setEditingFiles] = useState<Record<string, File | null>>(
    {}
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/menu-items", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load menu items.");
      }

      setItems(data.items);
      setCategories(data.categories);
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

    if (!value) return items;

    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(value) ||
        item.category?.name?.toLowerCase().includes(value) ||
        item.status.toLowerCase().includes(value) ||
        item.tags?.toLowerCase().includes(value)
      );
    });
  }, [items, search]);

  const allFilteredSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedIds.includes(item.id));

  function updateLocalItem(id: string, field: keyof MenuItem, value: any) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  function toggleSelectItem(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  }

  function toggleSelectAllFiltered() {
    if (allFilteredSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !filteredItems.some((item) => item.id === id))
      );
      return;
    }

    const filteredIds = filteredItems.map((item) => item.id);

    setSelectedIds((current) => Array.from(new Set([...current, ...filteredIds])));
  }

  function buildFormData(item: any, imageFile?: File | null) {
    const formData = new FormData();

    Object.entries(item).forEach(([key, value]) => {
      if (key === "imageFile") return;
      formData.append(key, String(value ?? ""));
    });

    if (imageFile) {
      formData.append("imageFile", imageFile);
    }

    return formData;
  }

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const formData = buildFormData(newItem, newItem.imageFile);

      const response = await fetch("/api/admin/menu-items", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create item.");
      }

      setNewItem(emptyItem);
      setMessage("Menu item created successfully.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to create item.");
    } finally {
      setSaving(false);
    }
  }

  async function saveItem(item: MenuItem) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();

      formData.append("id", item.id);
      formData.append("name", item.name);
      formData.append("categoryId", item.categoryId);
      formData.append("price", String(item.price));
      formData.append("description", item.description || "");
      formData.append("tags", item.tags || "");
      formData.append("allergens", item.allergens || "");
      formData.append("status", item.status || "active");
      formData.append("currentImage", item.image || "");

      const imageFile = editingFiles[item.id];

      if (imageFile) {
        formData.append("imageFile", imageFile);
      }

      const response = await fetch("/api/admin/menu-items", {
        method: "PATCH",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update item.");
      }

      setEditingFiles((current) => ({ ...current, [item.id]: null }));
      setMessage("Menu item updated successfully.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to update item.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: MenuItem) {
    const confirmed = window.confirm(`Delete "${item.name}"?`);
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/menu-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete item.");
      }

      setSelectedIds((current) => current.filter((id) => id !== item.id));
      setMessage("Menu item deleted successfully.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete item.");
    } finally {
      setSaving(false);
    }
  }

  async function bulkUpdateStatus() {
    if (selectedIds.length === 0 || !bulkStatus) return;

    const confirmed = window.confirm(
      `Update ${selectedIds.length} selected item(s) to "${bulkStatus}"?`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const selectedItems = items.filter((item) => selectedIds.includes(item.id));

      for (const item of selectedItems) {
        const formData = new FormData();

        formData.append("id", item.id);
        formData.append("name", item.name);
        formData.append("categoryId", item.categoryId);
        formData.append("price", String(item.price));
        formData.append("description", item.description || "");
        formData.append("tags", item.tags || "");
        formData.append("allergens", item.allergens || "");
        formData.append("status", bulkStatus);
        formData.append("currentImage", item.image || "");

        const response = await fetch("/api/admin/menu-items", {
          method: "PATCH",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || `Failed to update ${item.name}.`);
        }
      }

      setMessage("Bulk status updated successfully.");
      setBulkStatus("");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Bulk update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function bulkDeleteItems() {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected item(s)? This cannot be undone.`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      for (const id of selectedIds) {
        const response = await fetch("/api/admin/menu-items", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to delete selected item.");
        }
      }

      setSelectedIds([]);
      setExpandedItemId(null);
      setMessage("Selected menu items deleted successfully.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Bulk delete failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <section className="border-b border-[#ddcfba] bg-white px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            Admin / Menu
          </p>

          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl font-black text-[#3b1f18]">
                Menu Items
              </h1>
              <p className="mt-2 text-sm text-[#7b6255]">
                Create, edit, delete and upload images for menu items.
              </p>
            </div>

            <Link
              href="/admin/assign-addons"
              className="sinet-gold-button w-full lg:w-auto"
            >
              Assign Addons
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 xl:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/8">
          <h2 className="font-display text-2xl font-black text-[#3b1f18]">
            Create Item
          </h2>

          <form onSubmit={createItem} className="mt-6 space-y-4">
            <input
              value={newItem.name}
              onChange={(event) =>
                setNewItem({ ...newItem, name: event.target.value })
              }
              placeholder="Item name"
              required
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <select
              value={newItem.categoryId}
              onChange={(event) =>
                setNewItem({ ...newItem, categoryId: event.target.value })
              }
              required
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <input
              value={newItem.price}
              onChange={(event) =>
                setNewItem({ ...newItem, price: event.target.value })
              }
              type="number"
              step="0.01"
              placeholder="Price"
              required
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <div>
              <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                Item Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setNewItem({
                    ...newItem,
                    imageFile: event.target.files?.[0] || null,
                  })
                }
                className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
              />
            </div>

            <textarea
              value={newItem.description}
              onChange={(event) =>
                setNewItem({ ...newItem, description: event.target.value })
              }
              placeholder="Description"
              className="min-h-24 w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <input
              value={newItem.tags}
              onChange={(event) =>
                setNewItem({ ...newItem, tags: event.target.value })
              }
              placeholder="popular,favorite"
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <input
              value={newItem.allergens}
              onChange={(event) =>
                setNewItem({ ...newItem, allergens: event.target.value })
              }
              placeholder="gluten,milk"
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <select
              value={newItem.status}
              onChange={(event) =>
                setNewItem({ ...newItem, status: event.target.value })
              }
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
              <option value="sold_out">Sold Out</option>
            </select>

            <button disabled={saving} className="sinet-gold-button w-full">
              {saving ? "Saving..." : "Create Item"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
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
                  Existing Items
                </h2>
                <p className="mt-1 text-sm text-[#7b6255]">
                  {filteredItems.length} item
                  {filteredItems.length === 1 ? "" : "s"} shown ·{" "}
                  {selectedIds.length} selected
                </p>
              </div>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search item, category, status..."
                className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c] lg:max-w-sm"
              />
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
                    <option value="active">Set Active</option>
                    <option value="hidden">Set Hidden</option>
                    <option value="sold_out">Set Sold Out</option>
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
                    onClick={bulkDeleteItems}
                    disabled={saving || selectedIds.length === 0}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-black text-red-600 disabled:opacity-50"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <p className="mt-5 text-sm text-[#7b6255]">Loading...</p>
            ) : filteredItems.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] p-10 text-center text-sm text-[#7b6255]">
                No menu items found.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {filteredItems.map((item) => {
                  const expanded = expandedItemId === item.id;
                  const selected = selectedIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border bg-[#fffaf3] transition ${
                        selected
                          ? "border-[#3b1f18]"
                          : "border-[#eadfce]"
                      }`}
                    >
                      <div className="flex gap-4 p-4">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelectItem(item.id)}
                          className="mt-2"
                          onClick={(event) => event.stopPropagation()}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedItemId(expanded ? null : item.id)
                          }
                          className="grid flex-1 gap-4 text-left lg:grid-cols-[90px_1fr_auto]"
                        >
                          <div className="h-20 w-20 overflow-hidden rounded-2xl bg-[#eadcc6]">
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

                          <div className="min-w-0">
                            <h3 className="font-display text-xl font-black text-[#3b1f18]">
                              {item.name}
                            </h3>
                            <p className="mt-1 text-sm text-[#7b6255]">
                              {item.category?.name} · €{" "}
                              {Number(item.price || 0).toFixed(2)} ·{" "}
                              {item.status}
                            </p>
                            <p className="mt-1 text-xs font-bold text-[#9c806b]">
                              {item.addonGroupLinks.length} addon group
                              {item.addonGroupLinks.length === 1 ? "" : "s"}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#3b1f18]">
                              {expanded ? "Close" : "Edit"}
                            </span>
                          </div>
                        </button>
                      </div>

                      {expanded && (
                        <div className="border-t border-[#eadfce] p-4">
                          <div className="grid gap-4 lg:grid-cols-[120px_1fr]">
                            <div className="overflow-hidden rounded-2xl bg-[#eadcc6]">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-32 w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-32 items-center justify-center">
                                  <span className="font-script text-4xl text-[#3b1f18]/50">
                                    Sinet
                                  </span>
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="grid gap-3 lg:grid-cols-[1fr_140px_160px_130px]">
                                <input
                                  value={item.name}
                                  onChange={(event) =>
                                    updateLocalItem(
                                      item.id,
                                      "name",
                                      event.target.value
                                    )
                                  }
                                  className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                                />

                                <input
                                  value={String(item.price)}
                                  onChange={(event) =>
                                    updateLocalItem(
                                      item.id,
                                      "price",
                                      event.target.value
                                    )
                                  }
                                  type="number"
                                  step="0.01"
                                  className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                                />

                                <select
                                  value={item.categoryId}
                                  onChange={(event) =>
                                    updateLocalItem(
                                      item.id,
                                      "categoryId",
                                      event.target.value
                                    )
                                  }
                                  className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                                >
                                  {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                      {category.name}
                                    </option>
                                  ))}
                                </select>

                                <select
                                  value={item.status}
                                  onChange={(event) =>
                                    updateLocalItem(
                                      item.id,
                                      "status",
                                      event.target.value
                                    )
                                  }
                                  className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                                >
                                  <option value="active">Active</option>
                                  <option value="hidden">Hidden</option>
                                  <option value="sold_out">Sold Out</option>
                                </select>
                              </div>

                              <textarea
                                value={item.description || ""}
                                onChange={(event) =>
                                  updateLocalItem(
                                    item.id,
                                    "description",
                                    event.target.value
                                  )
                                }
                                className="mt-3 min-h-20 w-full rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                              />

                              <div className="mt-3 grid gap-3 md:grid-cols-3">
                                <input
                                  value={item.tags || ""}
                                  onChange={(event) =>
                                    updateLocalItem(
                                      item.id,
                                      "tags",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Tags"
                                  className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                                />

                                <input
                                  value={item.allergens || ""}
                                  onChange={(event) =>
                                    updateLocalItem(
                                      item.id,
                                      "allergens",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Allergens"
                                  className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                                />

                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) =>
                                    setEditingFiles((current) => ({
                                      ...current,
                                      [item.id]: event.target.files?.[0] || null,
                                    }))
                                  }
                                  className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                                />
                              </div>

                              <div className="mt-4 flex flex-wrap items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => saveItem(item)}
                                  disabled={saving}
                                  className="rounded-xl bg-[#3b1f18] px-4 py-2 text-sm font-black text-white"
                                >
                                  Save
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteItem(item)}
                                  disabled={saving}
                                  className="rounded-xl border border-red-200 px-4 py-2 text-sm font-black text-red-600"
                                >
                                  Delete
                                </button>

                                <Link
                                  href="/admin/assign-addons"
                                  className="rounded-xl border border-[#d8c9ac] px-4 py-2 text-sm font-black text-[#3b1f18]"
                                >
                                  Manage Addons
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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