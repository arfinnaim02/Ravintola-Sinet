"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MenuItemCard from "../../components/MenuItemCard";
import MenuItemPreviewModal from "../../components/MenuItemPreviewModal";
import MenuCouponHero from "../../components/MenuCouponHero";
import { MenuItem } from "../../contexts/CartContext";
import { useLanguage } from "../../i18n/LanguageContext";

type CategoryFromApi = {
  id: string;
  name: string;
  slug: string;
  order?: number;
};

type MenuItemFromApi = {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  image: string | null;
  tags?: string | null;
  allergens?: string | null;
  status?: string;
  categoryId?: string;
  category?: CategoryFromApi | null;
};

type GroupedCategory = {
  category: CategoryFromApi;
  items: MenuItemFromApi[];
};

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function fuzzyScore(query: string, text: string) {
  const q = normalizeText(query);
  const t = normalizeText(text);

  if (!q) return 0;
  if (t.includes(q)) return 100;

  let score = 0;
  let lastIndex = -1;

  for (const char of q) {
    const foundIndex = t.indexOf(char, lastIndex + 1);

    if (foundIndex === -1) {
      score -= 3;
      continue;
    }

    score += foundIndex === lastIndex + 1 ? 8 : 4;
    lastIndex = foundIndex;
  }

  return score;
}

function convertItem(item: MenuItemFromApi): MenuItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description || "",
    price: Number(item.price || 0),
    category: item.category?.slug || "",
    image: item.image || "",
  };
}

export default function MenuPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<MenuItemFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetch("/api/menu", { cache: "no-store" });

        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }

        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load menu.");
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, CategoryFromApi>();

    items.forEach((item) => {
      if (item.category?.slug && item.category?.name) {
        map.set(item.category.slug, item.category);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      return orderA - orderB || a.name.localeCompare(b.name);
    });
  }, [items]);

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];

    return items
      .map((item) => {
        const combinedText = [
          item.name,
          item.description || "",
          item.category?.name || "",
          item.tags || "",
        ].join(" ");

        return {
          item,
          score: fuzzyScore(search, combinedText),
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((entry) => entry.item);
  }, [items, search]);

  const visibleItems = useMemo(() => {
    const searchValue = normalizeText(search);

    if (!searchValue) return items;

    return items.filter((item) => {
      const combinedText = [
        item.name,
        item.description || "",
        item.category?.name || "",
        item.tags || "",
      ].join(" ");

      return fuzzyScore(searchValue, combinedText) > 0;
    });
  }, [items, search]);

  const groupedCategories = useMemo<GroupedCategory[]>(() => {
    return categories
      .map((category) => ({
        category,
        items: visibleItems.filter((item) => item.category?.slug === category.slug),
      }))
      .filter((group) => group.items.length > 0);
  }, [categories, visibleItems]);

  useEffect(() => {
    if (groupedCategories.length > 0 && !activeCategory) {
      setActiveCategory(groupedCategories[0].category.slug);
    }
  }, [groupedCategories, activeCategory]);

  useEffect(() => {
    if (groupedCategories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry?.target?.id) {
          const slug = visibleEntry.target.id.replace("category-", "");
          setActiveCategory(slug);

          const button = categoryButtonRefs.current[slug];
          button?.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      },
      {
        root: null,
        rootMargin: "-180px 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );

    groupedCategories.forEach((group) => {
      const element = document.getElementById(`category-${group.category.slug}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [groupedCategories]);

  const openPreview = (id: string) => {
    setPreviewItemId(id);
    setIsPreviewOpen(true);
  };

  const scrollToCategory = (slug: string) => {
    const section = document.getElementById(`category-${slug}`);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    setActiveCategory(slug);
  };

  const handleSuggestionClick = (item: MenuItemFromApi) => {
    setSearch(item.name);
    setShowSuggestions(false);

    setTimeout(() => {
      const section = document.getElementById(`menu-item-${item.id}`);
      section?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
  };

const totalItemsText =
    visibleItems.length === 1
      ? `1 ${t("menuItemFound")}`
      : `${visibleItems.length} ${t("menuItemsFound")}`;
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4eee4]">
        <section className="bg-[#1b0e0a] px-4 py-20 text-center text-white">
          <p className="text-xs font-bold tracking-[0.4em] text-[#d7b875]">
            RAVINTOLA SINET
          </p>
          <h1 className="mt-4 font-script text-7xl">{t("menuPageTitle")}</h1>
        </section>

        <div className="sinet-container py-16 text-center">
          <p className="text-[#7b6255]">{t("loadingMenu")}</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f4eee4]">
        <section className="bg-[#1b0e0a] px-4 py-20 text-center text-white">
          <p className="text-xs font-bold tracking-[0.4em] text-[#d7b875]">
            RAVINTOLA SINET
          </p>
          <h1 className="mt-4 font-script text-7xl">Menu</h1>
        </section>

        <div className="sinet-container py-16 text-center">
          <p className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">
            {t("errorLoadingMenu")}: {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4eee4]">
      
      <MenuCouponHero />

      <section className="sticky top-20 z-30 border-b border-[#ded1bd] bg-[#f4eee4]/95 backdrop-blur">
        <div className="sinet-container py-5">
          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={t("menuSearchPlaceholder")}
              className="w-full rounded-full border border-[#d8c9ac] bg-white px-5 py-4 pr-14 text-sm font-semibold text-[#3b1f18] outline-none transition placeholder:text-[#a78c78] focus:border-[#c9a45c] focus:ring-4 focus:ring-[#c9a45c]/15"
            />

            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9c806b]">
              ⌕
            </span>

            {showSuggestions && search.trim() && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[58px] z-40 overflow-hidden rounded-2xl border border-[#e2d5c2] bg-white shadow-2xl shadow-[#3b1f18]/15">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={() => handleSuggestionClick(item)}
                    className="flex w-full items-center gap-4 border-b border-[#f1e7d8] px-4 py-3 text-left transition last:border-b-0 hover:bg-[#f8f2e8]"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#efe3ce]">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-script text-2xl text-[#3b1f18]/50">
                            Sinet
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base font-black text-[#3b1f18]">
                        {item.name}
                      </p>
                      <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.22em] text-[#b09876]">
                        {item.category?.name || t("menuPageTitle")}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-black text-[#3b1f18]">
                      € {Number(item.price || 0).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="shrink-0 text-sm font-black text-[#7b6255]">
              {totalItemsText}
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setShowSuggestions(false);
              }}
              className="text-sm font-bold text-[#3b1f18] underline underline-offset-4"
            >
              {t("clear")}
            </button>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {groupedCategories.map((group) => (
              <button
                key={group.category.slug}
                ref={(el) => {
                  categoryButtonRefs.current[group.category.slug] = el;
                }}
                type="button"
                onClick={() => scrollToCategory(group.category.slug)}
                className={`shrink-0 rounded-full border px-5 py-3 text-sm font-black transition ${
                  activeCategory === group.category.slug
                    ? "border-[#3b1f18] bg-[#3b1f18] text-white shadow-lg shadow-[#3b1f18]/15"
                    : "border-[#d8c9ac] bg-white text-[#3b1f18] hover:border-[#c9a45c]"
                }`}
              >
                {group.category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="sinet-container py-10 md:py-14">
        {groupedCategories.length === 0 ? (
          <div className="rounded-2xl border border-[#e1d4c0] bg-white px-6 py-16 text-center shadow-xl shadow-[#3b1f18]/5">
            <h2 className="font-display text-2xl font-black text-[#3b1f18]">
              {t("noMenuItemsFound")}
            </h2>
            <p className="mt-3 text-sm text-[#7b6255]">
              {t("tryAnotherSearch")}
            </p>
          </div>
        ) : (
          <div className="space-y-14">
            {groupedCategories.map((group) => (
              <div
                key={group.category.slug}
                id={`category-${group.category.slug}`}
                className="scroll-mt-[245px]"
              >
                <div className="mb-6 flex items-center gap-5">
                  <h2 className="shrink-0 font-display text-3xl font-black text-[#3b1f18]">
                    {group.category.name}
                  </h2>
                  <div className="h-px flex-1 bg-[#ded1bd]" />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {group.items.map((raw) => (
                    <div key={raw.id} id={`menu-item-${raw.id}`}>
                    <MenuItemCard
                      item={convertItem(raw)}
                      categoryName={raw.category?.name}
                      tags={raw.tags}
                      allergens={raw.allergens}
                      onPreview={() => openPreview(raw.id)}
                    />
                  </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#6b3c28] text-2xl text-white shadow-2xl shadow-[#3b1f18]/30 transition hover:bg-[#3b1f18]"
        aria-label={t("backToTop")}
      >
        ↑
      </button>
      <MenuItemPreviewModal
        itemId={previewItemId}
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </main>
  );
}