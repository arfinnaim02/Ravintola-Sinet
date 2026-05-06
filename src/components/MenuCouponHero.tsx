"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../i18n/LanguageContext";

type FeaturedCoupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: string | number;
  minSubtotal: string | number;
  featuredTitle: string;
  featuredSubtitle: string;
  featuredIcon: string;
};

function PercentIcon() {
  return (
    <svg viewBox="0 0 120 120" className="h-10 w-10 text-[#8a5127] sm:h-20 sm:w-20" fill="none">
      <circle cx="60" cy="60" r="46" stroke="currentColor" strokeWidth="5" />
      <circle cx="45" cy="45" r="7" fill="currentColor" />
      <circle cx="75" cy="75" r="7" fill="currentColor" />
      <path d="M79 38 41 82" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20 text-[#8a5127]" fill="none">
      <path d="M18 70h54V38H18v32Z" stroke="currentColor" strokeWidth="6" />
      <path d="M72 50h18l12 15v5H72V50Z" stroke="currentColor" strokeWidth="6" />
      <circle cx="38" cy="78" r="9" stroke="currentColor" strokeWidth="6" />
      <circle cx="86" cy="78" r="9" stroke="currentColor" strokeWidth="6" />
      <path d="M32 51h25M25 61h32" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20 text-[#8a5127]" fill="none">
      <path d="M24 52h72v46H24V52Z" stroke="currentColor" strokeWidth="6" />
      <path d="M18 38h84v18H18V38Z" stroke="currentColor" strokeWidth="6" />
      <path d="M60 38v60" stroke="currentColor" strokeWidth="6" />
      <path d="M60 38s-22-1-22-14c0-8 9-11 15-6 6 5 7 20 7 20Zm0 0s22-1 22-14c0-8-9-11-15-6-6 5-7 20-7 20Z" stroke="currentColor" strokeWidth="6" />
    </svg>
  );
}

function CouponIcon({ type }: { type: string }) {
  if (type === "delivery") return <DeliveryIcon />;
  if (type === "gift") return <GiftIcon />;
  return <PercentIcon />;
}

function fallbackTitle(coupon: FeaturedCoupon, t: ReturnType<typeof useLanguage>["t"]) {
  if (coupon.featuredTitle) return coupon.featuredTitle;

  if (coupon.discountType === "percent") {
    return `${coupon.discountValue}% ${t("couponOff")}`;
  }

  if (coupon.discountType === "fixed") {
    return `€${Number(coupon.discountValue || 0).toFixed(2)} ${t("couponOff")}`;
  }

  return t("freeDelivery");
}

function fallbackSubtitle(coupon: FeaturedCoupon, t: ReturnType<typeof useLanguage>["t"]) {
  if (coupon.featuredSubtitle) return coupon.featuredSubtitle;

  if (Number(coupon.minSubtotal || 0) > 0) {
    return `${t("onOrdersOver")} €${Number(coupon.minSubtotal).toFixed(0)}`;
  }

  return `${t("useCode")} ${coupon.code}`;
}

export default function MenuCouponHero() {
  const { t } = useLanguage();
  const [coupons, setCoupons] = useState<FeaturedCoupon[]>([]);
  const [claimedCode, setClaimedCode] = useState("");

  useEffect(() => {
    async function loadCoupons() {
      try {
        const response = await fetch("/api/coupons/featured", {
          cache: "no-store",
        });

        const data = await response.json();

        if (data.success && Array.isArray(data.coupons)) {
          setCoupons(data.coupons);
        }
      } catch {
        setCoupons([]);
      }
    }

    loadCoupons();

    const stored = localStorage.getItem("claimedCouponCode");
    if (stored) setClaimedCode(stored);
  }, []);

  function claimCoupon(code: string) {
    localStorage.setItem("claimedCouponCode", code);
    setClaimedCode(code);
  }

  if (coupons.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#f4eee4] px-3 py-4 sm:px-4 md:py-8">
      <div className="sinet-container">
        <div className="relative overflow-hidden rounded-[1.4rem] border border-[#ddcfba] bg-[#1b0e0a] shadow-xl shadow-[#3b1f18]/15 sm:rounded-[2rem]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(215,184,117,0.25),transparent_34%),radial-gradient(circle_at_85%_30%,rgba(255,255,255,0.12),transparent_28%)]" />
          <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent)]" />

          <div className="relative mx-auto max-w-6xl px-4 py-5 sm:px-8 sm:py-8 lg:px-12">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#d7b875]">
                {t("specialOffers")}
              </p>

                <h2 className="mt-2 font-display text-2xl font-black text-white sm:text-4xl">
                {t("specialCoupons")}
                </h2>

                <p className="mx-auto mt-2 max-w-2xl text-xs leading-6 text-white/70 sm:text-sm">
                {t("couponHeroSubtitle")}
                </p>
            </div>

            <div
            className={`mt-5 grid gap-3 sm:gap-5 ${
                coupons.length === 1 ? "mx-auto max-w-xl" : "sm:grid-cols-2"
            }`}
            >
              {coupons.map((coupon) => {
                const isClaimed = claimedCode === coupon.code;

                return (
                  <article
                    key={coupon.id}
                    className="group rounded-2xl border border-white/10 bg-white/[0.94] p-4 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:bg-white sm:rounded-[1.75rem] sm:p-6"
                  >
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#fffaf3] shadow-lg shadow-[#3b1f18]/10 sm:h-28 sm:w-28 sm:rounded-3xl">
                        <CouponIcon type={coupon.featuredIcon} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
                          {t("code")}: {coupon.code}
                        </p>

                        <h3 className="mt-1 font-display text-xl font-black leading-tight text-[#3b1f18] sm:mt-2 sm:text-2xl">
                          {fallbackTitle(coupon, t)}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-[#7b6255]">
                          {fallbackSubtitle(coupon, t)}
                        </p>

                        <button
                          type="button"
                          onClick={() => claimCoupon(coupon.code)}
                          className={`mt-3 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-xs font-black transition sm:mt-5 sm:px-5 sm:py-3 sm:text-sm ${
                            isClaimed
                              ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                              : "bg-[#3b1f18] text-white hover:bg-[#c9a45c] hover:text-[#3b1f18]"
                          }`}
                        >
                          <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                            ✓
                          </span>
                          {isClaimed ? t("couponClaimed") : t("claimCoupon")}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {claimedCode && (
              <div className="mt-7 flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#d7b875]/25 bg-white/10 px-4 py-4 text-center sm:flex-row">
                <p className="text-sm font-bold text-white/80">
                  {t("claimedCoupon")}:{" "}
                    <span className="text-[#d7b875]">{claimedCode}</span>
                </p>

                <Link
                  href="/checkout"
                  className="rounded-full bg-[#c9a45c] px-5 py-2 text-sm font-black text-[#3b1f18] transition hover:bg-[#d7b875]"
                >
                  {t("goToCheckout")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}