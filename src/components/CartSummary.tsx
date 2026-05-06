"use client";

import { useCart } from "../contexts/CartContext";
import { useLanguage } from "../i18n/LanguageContext";

export default function CartSummary() {
  const { t } = useLanguage();
  const { cart, updateQuantity, removeItem, totalPrice } = useCart();

  return (
    <section className="rounded-3xl border border-[#e0d3bf] bg-white p-5 shadow-xl shadow-[#3b1f18]/10 sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
            {t("cart")}
          </p>
          <h2 className="mt-1 font-display text-3xl font-black text-[#3b1f18]">
            {t("cartYourOrder")}
          </h2>
        </div>

        <span className="rounded-full bg-[#f4eee4] px-4 py-2 text-sm font-black text-[#3b1f18]">
          {cart.length} {cart.length === 1 ? t("item") : t("items")}
        </span>
      </div>

      {cart.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d8c9ac] bg-[#f8f2e8] px-5 py-10 text-center">
          <p className="font-display text-2xl font-black text-[#3b1f18]">
            {t("cartEmptyTitle")}
          </p>
          <p className="mt-2 text-sm text-[#7b6255]">
            {t("cartEmptyText")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cart.map((item) => {
            const identifier = item.cartKey || item.id;
            const unitPrice = Number(item.price || 0);
            const basePrice = Number(item.basePrice || item.price || 0);
            const lineTotal = unitPrice * item.quantity;

            return (
              <article
                key={identifier}
                className="rounded-2xl border border-[#eadfce] bg-[#fffaf3] p-4"
              >
                <div className="flex gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#eadcc6]">
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
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-black leading-snug text-[#3b1f18]">
                          {item.name}
                        </h3>

                        <p className="mt-1 text-xs font-bold text-[#9c806b]">
                          {t("cartBase")}: €{basePrice.toFixed(2)}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-black text-[#3b1f18]">
                        €{lineTotal.toFixed(2)}
                      </p>
                    </div>

                    {item.addons && item.addons.length > 0 && (
                      <div className="mt-3 rounded-xl bg-white px-3 py-2">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#b09876]">
                          {t("cartAddons")}
                        </p>

                        <div className="space-y-1">
                          {item.addons.map((addon) => (
                            <div
                              key={`${identifier}-${addon.optionId}`}
                              className="flex justify-between gap-3 text-xs text-[#7b6255]"
                            >
                              <span>
                                {addon.groupName}:{" "}
                                <strong>{addon.optionName}</strong>
                              </span>
                              <span className="font-bold">
                                +€{Number(addon.optionPrice || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center overflow-hidden rounded-full border border-[#d8c9ac] bg-white">
                        <button
                          type="button"
                          aria-label={t("cartDecreaseQuantity")}
                          className="flex h-9 w-10 items-center justify-center text-lg font-black text-[#3b1f18] hover:bg-[#f4eee4]"
                          onClick={() =>
                            updateQuantity(identifier, item.quantity - 1)
                          }
                        >
                          −
                        </button>

                        <span className="flex h-9 min-w-10 items-center justify-center px-3 text-sm font-black text-[#3b1f18]">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          aria-label={t("cartIncreaseQuantity")}
                          className="flex h-9 w-10 items-center justify-center text-lg font-black text-[#3b1f18] hover:bg-[#f4eee4]"
                          onClick={() =>
                            updateQuantity(identifier, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        aria-label={t("cartRemoveItem")}
                        className="text-xs font-black uppercase tracking-[0.18em] text-red-600 underline underline-offset-4"
                        onClick={() => removeItem(identifier)}
                      >
                        {t("remove")}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 border-t border-[#eadfce] pt-5">
        <div className="flex items-center justify-between">
          <span className="font-display text-2xl font-black text-[#3b1f18]">
            {t("checkoutTotal")}
          </span>
          <span className="text-2xl font-black text-[#3b1f18]">
            €{totalPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </section>
  );
}