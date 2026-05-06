"use client";

import { useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  order: number;
  _count: {
    menuItems: number;
  };
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newOrder, setNewOrder] = useState(0);
  const [newActive, setNewActive] = useState(true);

  async function loadCategories() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/categories", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load categories.");
      }

      setCategories(data.categories);
    } catch (err: any) {
      setError(err?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName,
          slug: newSlug,
          order: newOrder,
          isActive: newActive,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create category.");
      }

      setNewName("");
      setNewSlug("");
      setNewOrder(0);
      setNewActive(true);
      setMessage("Category created successfully.");
      await loadCategories();
    } catch (err: any) {
      setError(err?.message || "Failed to create category.");
    } finally {
      setSaving(false);
    }
  }

  async function updateCategory(category: Category) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(category),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update category.");
      }

      setMessage("Category updated successfully.");
      await loadCategories();
    } catch (err: any) {
      setError(err?.message || "Failed to update category.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: Category) {
    if (category._count.menuItems > 0) {
      setError("This category has menu items. Move or delete those items first.");
      return;
    }

    const confirmed = window.confirm(`Delete category "${category.name}"?`);
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: category.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete category.");
      }

      setMessage("Category deleted successfully.");
      await loadCategories();
    } catch (err: any) {
      setError(err?.message || "Failed to delete category.");
    } finally {
      setSaving(false);
    }
  }

  function updateLocalCategory(id: string, field: keyof Category, value: any) {
    setCategories((current) =>
      current.map((category) =>
        category.id === id ? { ...category, [field]: value } : category
      )
    );
  }

  return (
    <main>
      <section className="border-b border-[#ddcfba] bg-white px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            Admin / Menu Setup
          </p>
          <h1 className="mt-2 font-display text-4xl font-black text-[#3b1f18]">
            Categories
          </h1>
          <p className="mt-2 text-sm text-[#7b6255]">
            Manage menu categories shown on the public menu page.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/8">
          <h2 className="font-display text-2xl font-black text-[#3b1f18]">
            Add Category
          </h2>

          <form onSubmit={createCategory} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                Name
              </label>
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                required
                placeholder="Pizzat"
                className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                Slug
              </label>
              <input
                value={newSlug}
                onChange={(event) => setNewSlug(event.target.value)}
                placeholder="pizzat"
                className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
              />
              <p className="mt-2 text-xs text-[#7b6255]">
                Leave empty to generate automatically.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                Order
              </label>
              <input
                type="number"
                value={newOrder}
                onChange={(event) => setNewOrder(Number(event.target.value))}
                className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-[#eadfce] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#3b1f18]">
              <input
                type="checkbox"
                checked={newActive}
                onChange={(event) => setNewActive(event.target.checked)}
              />
              Active
            </label>

            <button
              type="submit"
              disabled={saving}
              className="sinet-gold-button w-full disabled:opacity-60"
            >
              {saving ? "Saving..." : "Create Category"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-4 shadow-xl shadow-[#3b1f18]/8 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-black text-[#3b1f18]">
              Existing Categories
            </h2>
            <span className="rounded-full bg-[#f4eee4] px-4 py-2 text-sm font-black text-[#3b1f18]">
              {categories.length}
            </span>
          </div>

          {message && (
            <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] px-5 py-10 text-center text-[#7b6255]">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] px-5 py-10 text-center text-[#7b6255]">
              No categories found.
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4"
                >
                  <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_100px_90px_auto] lg:items-end">
                    <div>
                      <label className="mb-1 block text-xs font-black text-[#7b6255]">
                        Name
                      </label>
                      <input
                        value={category.name}
                        onChange={(event) =>
                          updateLocalCategory(category.id, "name", event.target.value)
                        }
                        className="w-full rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-black text-[#7b6255]">
                        Slug
                      </label>
                      <input
                        value={category.slug}
                        onChange={(event) =>
                          updateLocalCategory(category.id, "slug", event.target.value)
                        }
                        className="w-full rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-black text-[#7b6255]">
                        Order
                      </label>
                      <input
                        type="number"
                        value={category.order}
                        onChange={(event) =>
                          updateLocalCategory(
                            category.id,
                            "order",
                            Number(event.target.value)
                          )
                        }
                        className="w-full rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                      />
                    </div>

                    <label className="flex h-10 items-center gap-2 text-sm font-bold text-[#3b1f18]">
                      <input
                        type="checkbox"
                        checked={category.isActive}
                        onChange={(event) =>
                          updateLocalCategory(
                            category.id,
                            "isActive",
                            event.target.checked
                          )
                        }
                      />
                      Active
                    </label>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => updateCategory(category)}
                      className="rounded-xl bg-[#3b1f18] px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                    >
                      Save
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#eadfce] pt-3">
                    <p className="text-xs font-bold text-[#7b6255]">
                      {category._count.menuItems} menu items
                    </p>

                    <button
                      type="button"
                      disabled={category._count.menuItems > 0 || saving}
                      onClick={() => deleteCategory(category)}
                      className="text-xs font-black uppercase tracking-[0.15em] text-red-600 underline underline-offset-4 disabled:cursor-not-allowed disabled:text-[#b6a99a]"
                    >
                      {category._count.menuItems > 0 ? "Used" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}