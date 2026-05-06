"use client";

import { useEffect, useState } from "react";

type Banner = {
  id: string;
  image: string;
  mobileImage: string | null;
  eyebrow: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonUrl: string;
  isActive: boolean;
  order: number;
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadBanners() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/banners", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load banners.");
      }

      setBanners(data.banners);
    } catch (err: any) {
      setError(err?.message || "Failed to load banners.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBanners();
  }, []);

  async function createBanner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);

      formData.set("isActive", formData.get("isActive") === "on" ? "true" : "false");

      const response = await fetch("/api/admin/banners", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create banner.");
      }

      form.reset();
      setMessage("Banner created successfully.");
      await loadBanners();
    } catch (err: any) {
      setError(err?.message || "Failed to create banner.");
    } finally {
      setSaving(false);
    }
  }

  async function updateBanner(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("id", id);
      formData.set("isActive", formData.get("isActive") === "on" ? "true" : "false");

      const response = await fetch("/api/admin/banners", {
        method: "PATCH",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update banner.");
      }

      setMessage("Banner updated successfully.");
      await loadBanners();
    } catch (err: any) {
      setError(err?.message || "Failed to update banner.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBanner(id: string) {
    const confirmed = window.confirm("Delete this banner?");
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/banners", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete banner.");
      }

      setMessage("Banner deleted successfully.");
      await loadBanners();
    } catch (err: any) {
      setError(err?.message || "Failed to delete banner.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <section className="border-b border-[#ddcfba] bg-white px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            Admin / Homepage
          </p>
          <h1 className="mt-2 font-display text-4xl font-black text-[#3b1f18]">
            Hero Banners
          </h1>
          <p className="mt-2 text-sm text-[#7b6255]">
            Manage desktop and mobile hero slider images.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[430px_1fr]">
        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-6 shadow-xl shadow-[#3b1f18]/8">
          <h2 className="font-display text-2xl font-black text-[#3b1f18]">
            Add Banner
          </h2>

          <form onSubmit={createBanner} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                Desktop Image
              </label>
              <input
                name="image"
                type="file"
                accept="image/*"
                required
                className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-[#3b1f18]">
                Mobile Image
              </label>
              <input
                name="mobileImage"
                type="file"
                accept="image/*"
                className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
              />
              <p className="mt-2 text-xs text-[#7b6255]">
                Optional. If empty, desktop image will be used on mobile.
              </p>
            </div>

            <input
              name="eyebrow"
              placeholder="TASTE OF JOENSUU"
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <input
              name="title"
              placeholder="Ravintola Sinet"
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <textarea
              name="subtitle"
              placeholder="Fresh food, warm service and local favourites in Joensuu"
              className="min-h-24 w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <input
              name="buttonText"
              placeholder="Order Online"
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <input
              name="buttonUrl"
              placeholder="/menu"
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <input
              name="order"
              type="number"
              defaultValue={0}
              className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm"
            />

            <label className="flex items-center gap-3 rounded-2xl border border-[#eadfce] bg-[#fffaf3] px-4 py-3 text-sm font-bold text-[#3b1f18]">
              <input name="isActive" type="checkbox" defaultChecked />
              Active
            </label>

            <button disabled={saving} className="sinet-gold-button w-full">
              {saving ? "Saving..." : "Create Banner"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-[#e0d3bf] bg-white p-4 shadow-xl shadow-[#3b1f18]/8 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl font-black text-[#3b1f18]">
              Existing Banners
            </h2>
            <span className="rounded-full bg-[#f4eee4] px-4 py-2 text-sm font-black text-[#3b1f18]">
              {banners.length}
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
              Loading banners...
            </div>
          ) : banners.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8c9ac] bg-[#fffaf3] px-5 py-10 text-center text-[#7b6255]">
              No banners found.
            </div>
          ) : (
            <div className="space-y-5">
              {banners.map((banner) => (
                <form
                  key={banner.id}
                  onSubmit={(event) => updateBanner(event, banner.id)}
                  className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-black text-[#7b6255]">
                        Desktop
                      </p>
                      <img
                        src={banner.image}
                        alt="Desktop banner"
                        className="h-36 w-full rounded-2xl object-cover"
                      />
                      <input
                        name="image"
                        type="file"
                        accept="image/*"
                        className="mt-3 w-full text-sm"
                      />
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-black text-[#7b6255]">
                        Mobile
                      </p>
                      <img
                        src={banner.mobileImage || banner.image}
                        alt="Mobile banner"
                        className="h-36 w-full rounded-2xl object-cover"
                      />
                      <input
                        name="mobileImage"
                        type="file"
                        accept="image/*"
                        className="mt-3 w-full text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      name="eyebrow"
                      defaultValue={banner.eyebrow}
                      placeholder="Eyebrow"
                      className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                    />

                    <input
                      name="title"
                      defaultValue={banner.title}
                      placeholder="Title"
                      className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                    />

                    <input
                      name="buttonText"
                      defaultValue={banner.buttonText}
                      placeholder="Button text"
                      className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                    />

                    <input
                      name="buttonUrl"
                      defaultValue={banner.buttonUrl}
                      placeholder="Button URL"
                      className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                    />

                    <input
                      name="order"
                      type="number"
                      defaultValue={banner.order}
                      className="rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                    />

                    <label className="flex items-center gap-2 text-sm font-bold text-[#3b1f18]">
                      <input
                        name="isActive"
                        type="checkbox"
                        defaultChecked={banner.isActive}
                      />
                      Active
                    </label>
                  </div>

                  <textarea
                    name="subtitle"
                    defaultValue={banner.subtitle}
                    placeholder="Subtitle"
                    className="mt-3 min-h-20 w-full rounded-xl border border-[#d8c9ac] bg-white px-3 py-2 text-sm"
                  />

                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => deleteBanner(banner.id)}
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-black text-red-600"
                    >
                      Delete
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-[#3b1f18] px-4 py-2 text-sm font-black text-white"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}