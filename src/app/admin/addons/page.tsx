"use client";

import { useEffect, useState } from "react";

type AddonOption = {
  id: string;
  name: string;
  price: string | number;
  isActive: boolean;
  order: number;
};

type AddonGroup = {
  id: string;
  name: string;
  slug: string;
  selectionType: string;
  isActive: boolean;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number | null;
  freeChoicesCount: number;
  order: number;
  options: AddonOption[];
  _count: {
    menuItemLinks: number;
  };
};

const emptyGroup = {
  name: "",
  slug: "",
  selectionType: "multiple",
  isActive: true,
  isRequired: false,
  minSelect: 0,
  maxSelect: "",
  freeChoicesCount: 0,
  order: 0,
};

export default function AdminAddonsPage() {
  const [groups, setGroups] = useState<AddonGroup[]>([]);
  const [newGroup, setNewGroup] = useState<any>(emptyGroup);
  const [newOption, setNewOption] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAddons() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/addons", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load addons.");
      }

      setGroups(data.addonGroups);
    } catch (err: any) {
      setError(err?.message || "Failed to load addons.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddons();
  }, []);

  function updateLocalGroup(id: string, field: keyof AddonGroup, value: any) {
    setGroups((current) =>
      current.map((group) => (group.id === id ? { ...group, [field]: value } : group))
    );
  }

  function updateLocalOption(
    groupId: string,
    optionId: string,
    field: keyof AddonOption,
    value: any
  ) {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) return group;

        return {
          ...group,
          options: group.options.map((option) =>
            option.id === optionId ? { ...option, [field]: value } : option
          ),
        };
      })
    );
  }

  async function createGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create addon group.");
      }

      setNewGroup(emptyGroup);
      setMessage("Addon group created successfully.");
      await loadAddons();
    } catch (err: any) {
      setError(err?.message || "Failed to create addon group.");
    } finally {
      setSaving(false);
    }
  }

  async function saveGroup(group: AddonGroup) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/addons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(group),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save addon group.");
      }

      setMessage("Addon group saved.");
      await loadAddons();
    } catch (err: any) {
      setError(err?.message || "Failed to save addon group.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup(group: AddonGroup) {
    const confirmed = window.confirm(`Delete addon group "${group.name}"?`);
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/addons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: group.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete addon group.");
      }

      setMessage("Addon group deleted.");
      await loadAddons();
    } catch (err: any) {
      setError(err?.message || "Failed to delete addon group.");
    } finally {
      setSaving(false);
    }
  }

  async function createOption(groupId: string) {
    const option = newOption[groupId];

    if (!option?.name) {
      setError("Option name is required.");
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/addons/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          name: option.name,
          price: Number(option.price || 0),
          order: Number(option.order || 0),
          isActive: option.isActive ?? true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create option.");
      }

      setNewOption((current) => ({ ...current, [groupId]: {} }));
      setMessage("Addon option created.");
      await loadAddons();
    } catch (err: any) {
      setError(err?.message || "Failed to create option.");
    } finally {
      setSaving(false);
    }
  }

  async function saveOption(option: AddonOption) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/addons/options", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(option),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save option.");
      }

      setMessage("Addon option saved.");
      await loadAddons();
    } catch (err: any) {
      setError(err?.message || "Failed to save option.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteOption(option: AddonOption) {
    const confirmed = window.confirm(`Delete option "${option.name}"?`);
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/addons/options", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: option.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete option.");
      }

      setMessage("Addon option deleted.");
      await loadAddons();
    } catch (err: any) {
      setError(err?.message || "Failed to delete option.");
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
            Addon Groups
          </h1>
          <p className="mt-2 text-sm text-[#7b6255]">
            Create addon groups and manage addon options inside each group.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 xl:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/8">
          <h2 className="font-display text-2xl font-black text-[#3b1f18]">
            Create Addon Group
          </h2>

          <form onSubmit={createGroup} className="mt-6 space-y-4">
            <input
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              required
              placeholder="Pizza Toppings"
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <input
              value={newGroup.slug}
              onChange={(e) => setNewGroup({ ...newGroup, slug: e.target.value })}
              placeholder="pizza-toppings"
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <select
              value={newGroup.selectionType}
              onChange={(e) =>
                setNewGroup({ ...newGroup, selectionType: e.target.value })
              }
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            >
              <option value="single">Single choice</option>
              <option value="multiple">Multiple choice</option>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={newGroup.minSelect}
                onChange={(e) =>
                  setNewGroup({ ...newGroup, minSelect: Number(e.target.value) })
                }
                placeholder="Min"
                className="rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
              />

              <input
                type="number"
                value={newGroup.maxSelect}
                onChange={(e) =>
                  setNewGroup({ ...newGroup, maxSelect: e.target.value })
                }
                placeholder="Max"
                className="rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
              />
            </div>

            <input
              type="number"
              value={newGroup.freeChoicesCount}
              onChange={(e) =>
                setNewGroup({
                  ...newGroup,
                  freeChoicesCount: Number(e.target.value),
                })
              }
              placeholder="Default free choices"
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <input
              type="number"
              value={newGroup.order}
              onChange={(e) => setNewGroup({ ...newGroup, order: Number(e.target.value) })}
              placeholder="Order"
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <label className="flex items-center gap-3 rounded-2xl border border-[#eadfce] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#3b1f18]">
              <input
                type="checkbox"
                checked={newGroup.isRequired}
                onChange={(e) =>
                  setNewGroup({ ...newGroup, isRequired: e.target.checked })
                }
              />
              Required by default
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-[#eadfce] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#3b1f18]">
              <input
                type="checkbox"
                checked={newGroup.isActive}
                onChange={(e) =>
                  setNewGroup({ ...newGroup, isActive: e.target.checked })
                }
              />
              Active
            </label>

            <button disabled={saving} className="sinet-gold-button w-full">
              {saving ? "Saving..." : "Create Group"}
            </button>
          </form>
        </div>

        <div className="space-y-5">
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

          {loading ? (
            <div className="rounded-3xl border border-[#e0d3bf] bg-white p-10 text-center text-[#7b6255]">
              Loading addons...
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-3xl border border-[#e0d3bf] bg-white p-10 text-center text-[#7b6255]">
              No addon groups found.
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/8"
              >
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_140px_100px]">
                  <input
                    value={group.name}
                    onChange={(e) => updateLocalGroup(group.id, "name", e.target.value)}
                    className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                  />

                  <input
                    value={group.slug}
                    onChange={(e) => updateLocalGroup(group.id, "slug", e.target.value)}
                    className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                  />

                  <select
                    value={group.selectionType}
                    onChange={(e) =>
                      updateLocalGroup(group.id, "selectionType", e.target.value)
                    }
                    className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                  >
                    <option value="single">Single</option>
                    <option value="multiple">Multiple</option>
                  </select>

                  <input
                    type="number"
                    value={group.order}
                    onChange={(e) =>
                      updateLocalGroup(group.id, "order", Number(e.target.value))
                    }
                    className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                  />
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-5">
                  <input
                    type="number"
                    value={group.minSelect}
                    onChange={(e) =>
                      updateLocalGroup(group.id, "minSelect", Number(e.target.value))
                    }
                    placeholder="Min"
                    className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                  />

                  <input
                    type="number"
                    value={group.maxSelect ?? ""}
                    onChange={(e) =>
                      updateLocalGroup(
                        group.id,
                        "maxSelect",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    placeholder="Max"
                    className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                  />

                  <input
                    type="number"
                    value={group.freeChoicesCount}
                    onChange={(e) =>
                      updateLocalGroup(
                        group.id,
                        "freeChoicesCount",
                        Number(e.target.value)
                      )
                    }
                    placeholder="Default free"
                    className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                  />

                  <label className="flex items-center gap-2 text-sm font-bold text-[#3b1f18]">
                    <input
                      type="checkbox"
                      checked={group.isRequired}
                      onChange={(e) =>
                        updateLocalGroup(group.id, "isRequired", e.target.checked)
                      }
                    />
                    Required
                  </label>

                  <label className="flex items-center gap-2 text-sm font-bold text-[#3b1f18]">
                    <input
                      type="checkbox"
                      checked={group.isActive}
                      onChange={(e) =>
                        updateLocalGroup(group.id, "isActive", e.target.checked)
                      }
                    />
                    Active
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => saveGroup(group)}
                    className="rounded-xl bg-[#3b1f18] px-4 py-2 text-sm font-black text-white"
                  >
                    Save Group
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteGroup(group)}
                    disabled={group._count.menuItemLinks > 0}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-black text-red-600 disabled:cursor-not-allowed disabled:text-[#b6a99a]"
                  >
                    {group._count.menuItemLinks > 0 ? "Assigned" : "Delete Group"}
                  </button>
                </div>

                <div className="mt-6 border-t border-[#eadfce] pt-5">
                  <h3 className="font-display text-xl font-black text-[#3b1f18]">
                    Options
                  </h3>

                  <div className="mt-4 space-y-3">
                    {group.options.map((option) => (
                      <div key={option.id} className="grid gap-3 md:grid-cols-[1fr_120px_100px_90px_auto_auto]">
                        <input
                          value={option.name}
                          onChange={(e) =>
                            updateLocalOption(group.id, option.id, "name", e.target.value)
                          }
                          className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                        />

                        <input
                          type="number"
                          step="0.01"
                          value={String(option.price)}
                          onChange={(e) =>
                            updateLocalOption(group.id, option.id, "price", e.target.value)
                          }
                          className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                        />

                        <input
                          type="number"
                          value={option.order}
                          onChange={(e) =>
                            updateLocalOption(
                              group.id,
                              option.id,
                              "order",
                              Number(e.target.value)
                            )
                          }
                          className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                        />

                        <label className="flex items-center gap-2 text-sm font-bold">
                          <input
                            type="checkbox"
                            checked={option.isActive}
                            onChange={(e) =>
                              updateLocalOption(
                                group.id,
                                option.id,
                                "isActive",
                                e.target.checked
                              )
                            }
                          />
                          Active
                        </label>

                        <button
                          type="button"
                          onClick={() => saveOption(option)}
                          className="rounded-xl bg-[#3b1f18] px-4 py-2 text-sm font-black text-white"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteOption(option)}
                          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-black text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-[1fr_120px_100px_100px]">
                    <input
                      value={newOption[group.id]?.name || ""}
                      onChange={(e) =>
                        setNewOption((current) => ({
                          ...current,
                          [group.id]: {
                            ...current[group.id],
                            name: e.target.value,
                          },
                        }))
                      }
                      placeholder="New option name"
                      className="rounded-xl border border-[#d8c9ac] bg-[#fffaf3] px-3 py-2 text-sm"
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={newOption[group.id]?.price || ""}
                      onChange={(e) =>
                        setNewOption((current) => ({
                          ...current,
                          [group.id]: {
                            ...current[group.id],
                            price: e.target.value,
                          },
                        }))
                      }
                      placeholder="Price"
                      className="rounded-xl border border-[#d8c9ac] bg-[#fffaf3] px-3 py-2 text-sm"
                    />

                    <input
                      type="number"
                      value={newOption[group.id]?.order || ""}
                      onChange={(e) =>
                        setNewOption((current) => ({
                          ...current,
                          [group.id]: {
                            ...current[group.id],
                            order: e.target.value,
                          },
                        }))
                      }
                      placeholder="Order"
                      className="rounded-xl border border-[#d8c9ac] bg-[#fffaf3] px-3 py-2 text-sm"
                    />

                    <button
                      type="button"
                      onClick={() => createOption(group.id)}
                      className="rounded-xl bg-[#c9a45c] px-4 py-2 text-sm font-black text-[#3b1f18]"
                    >
                      Add Option
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}