"use client";

import { MenuItem } from "../contexts/CartContext";
import { useLanguage } from "../i18n/LanguageContext";

interface Props {
  item: MenuItem;
  categoryName?: string;
  tags?: string | null;
  allergens?: string | null;
  onPreview?: () => void;
}

export default function MenuItemCard({ item, categoryName, onPreview }: Props) {
  const { t } = useLanguage();
  const price = Number(item.price || 0);

  return (
    <article
      onClick={onPreview}
      className="group relative flex min-h-[170px] cursor-pointer overflow-hidden rounded-2xl border border-[#e5dac8] bg-white shadow-[0_8px_22px_rgba(59,31,24,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(59,31,24,0.14)]"
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between p-5 pr-3 sm:p-7">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#b09876]">
            {categoryName || item.category || t("navMenu")}
          </p>

          <h3 className="font-display text-xl font-black leading-snug text-[#3b1f18] sm:text-2xl">
            {item.name}
          </h3>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#806b60] sm:text-base">
            {item.description || t("freshlyPrepared")}
          </p>
        </div>

        <p className="mt-5 text-2xl font-black text-[#3b1f18]">
          € {price.toFixed(2)}
        </p>
      </div>

      <div className="relative flex w-[145px] shrink-0 items-center justify-center p-4 sm:w-[185px]">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-[110px] w-[125px] rounded-2xl object-cover shadow-md transition duration-500 group-hover:scale-105 sm:h-[135px] sm:w-[155px]"
          />
        ) : (
          <div className="flex h-[110px] w-[125px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#d8c49a] to-[#f4eee4] shadow-md sm:h-[135px] sm:w-[155px]">
            <div className="text-center">
              <p className="font-script text-4xl text-[#3b1f18]/60">Sinet</p>
              <p className="text-[9px] font-black tracking-[0.25em] text-[#9c806b]">
                {t("food")}
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPreview?.();
          }}
          className="absolute bottom-7 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#1f6feb] text-3xl font-light leading-none text-white shadow-xl shadow-blue-600/30 transition hover:scale-105 hover:bg-[#1557c0] sm:bottom-8 sm:right-5"
          aria-label={`${t("preview")} ${item.name}`}
        >
          +
        </button>
      </div>
    </article>
  );
}