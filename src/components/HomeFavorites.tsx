"use client";

import { useEffect, useMemo, useState } from "react";
import MenuItemPreviewModal from "./MenuItemPreviewModal";
import { MenuItem } from "../contexts/CartContext";

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
  tags?: string | null;
  category?: CategoryFromApi | null;
};

export default function HomeFavorites() {
  const [items, setItems] = useState<MenuItemFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    async function loadItems() {
      try {
        const response = await fetch("/api/menu", { cache: "no-store" });
        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, []);

  const favoriteItems = useMemo(() => {
    return items
      .filter((item) =>
        String(item.tags || "")
          .toLowerCase()
          .split(",")
          .map((tag) => tag.trim())
          .includes("favorite")
      )
      .slice(0, 4);
  }, [items]);

  function openPreview(id: string) {
    setPreviewItemId(id);
    setPreviewOpen(true);
  }

  if (loading) return null;
  if (favoriteItems.length === 0) return null;

  return (
    <section className="bg-[#f4eee4] px-4 py-16">
      <div className="mx-auto max-w-7xl">
        

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-7 lg:grid-cols-4">
          {favoriteItems.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-[#3b1f18]/10"
            >
              <div className="relative h-56 bg-[#eadcc6]">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="font-script text-5xl text-[#3b1f18]/40">
                      Sinet
                    </span>
                  </div>
                )}

                <span className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#3b1f18]">
                  Favorite
                </span>

                <span className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-xs font-black text-[#3b1f18]">
                  € {Number(item.price || 0).toFixed(2)}
                </span>
              </div>

              <div className="p-5">
                <h3 className="font-display text-xl font-black text-[#3b1f18]">
                  {item.name}
                </h3>

                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
                  {item.category?.name || "Menu"}
                </p>

                <p className="mt-5 line-clamp-3 min-h-[72px] text-sm leading-6 text-[#7b6255]">
                  {item.description || "Freshly prepared and served with care."}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-[#eadfce] pt-5">
                  <button
                    type="button"
                    onClick={() => openPreview(item.id)}
                    className="text-sm font-black text-[#3b1f18] underline underline-offset-4"
                  >
                    Preview
                  </button>

                  <button
                    type="button"
                    onClick={() => openPreview(item.id)}
                    className="rounded-full bg-[#c9a45c] px-5 py-3 text-sm font-black text-[#3b1f18]"
                  >
                    Order Now →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <MenuItemPreviewModal
        itemId={previewItemId}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </section>
  );
}