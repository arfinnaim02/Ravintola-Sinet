"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

type ReviewStats = {
  averageRating: number;
  totalReviews: number;
};

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.77l-.44 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.14 6.36 2.14 11.73c0 1.9.56 3.73 1.62 5.31L2 22l5.1-1.66a10.1 10.1 0 0 0 4.94 1.28c5.46 0 9.9-4.36 9.9-9.73S17.5 2 12.04 2Zm0 17.95a8.24 8.24 0 0 1-4.2-1.16l-.3-.18-3.02.98.99-2.86-.2-.31a7.9 7.9 0 0 1-1.3-4.35c0-4.45 3.6-8.06 8.03-8.06 4.43 0 8.03 3.61 8.03 8.06s-3.6 8.06-8.03 8.06Zm4.4-6.02c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.37-1.94-1.18-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

export default function Footer() {
  const { t } = useLanguage();

  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
  });

  useEffect(() => {
    async function loadReviewStats() {
      try {
        const response = await fetch("/api/reviews", { cache: "no-store" });
        const data = await response.json();

        if (data.success) {
          setStats({
            averageRating: Number(data.averageRating || 0),
            totalReviews: Number(data.totalReviews || 0),
          });
        }
      } catch {
        setStats({ averageRating: 0, totalReviews: 0 });
      }
    }

    loadReviewStats();
  }, []);

  const ratingText =
    stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : "0.0";

  return (
    <footer className="bg-[#3b1f18] px-4 py-14 text-white">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="font-serif text-2xl italic">Ravintola Sinet</h3>

            <p className="mt-5 text-sm leading-6 text-white/75">
              {t("footerAddress")}
            </p>

            <div className="mt-5 text-sm">
              <span className="font-semibold text-[#d7b875]">
                {ratingText} / 5
              </span>
              <span className="ml-2 text-[#d7b875]">★★★★★</span>
              <span className="ml-2 text-white/60">({stats.totalReviews})</span>
            </div>

            <Link
              href="/reviews"
              className="mt-5 inline-flex rounded-full bg-[#c9a45c] px-6 py-3 text-sm font-black text-[#3b1f18] transition hover:bg-[#d7b875]"
            >
              {t("footerGiveReview")}
            </Link>

            <div className="mt-6 flex items-center gap-3">
              <a href="https://www.instagram.com/sinet_joensuu/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-[#d7b875] hover:text-[#3b1f18]">
                <InstagramIcon />
              </a>

              <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-[#d7b875] hover:text-[#3b1f18]">
                <FacebookIcon />
              </a>

              <a href="https://wa.me/358504557367" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-[#d7b875] hover:text-[#3b1f18]">
                <WhatsAppIcon />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-xl font-semibold">{t("footerOpeningTimes")}</h3>
            <div className="mt-5 grid grid-cols-2 gap-y-2 text-sm text-white/75">
                <span>{t("dayMon")}</span><span>10:00–22:00</span>
                <span>{t("dayTue")}</span><span>10:00–22:00</span>
                <span>{t("dayWed")}</span><span>10:00–22:00</span>
                <span>{t("dayThu")}</span><span>10:00–22:00</span>
                <span>{t("dayFri")}</span><span>10:00–22:00</span>
                <span>{t("daySat")}</span><span>10:00–22:00</span>
                <span>{t("daySun")}</span><span>10:00–22:00</span>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-xl font-semibold">{t("footerContact")}</h3>

            <a href="tel:+358504557367" className="mt-5 block text-sm text-white/80 underline">
              +358504557367
            </a>

            <div className="mt-6 space-y-3">
              <Link href="/menu" className="block rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold transition hover:border-[#d7b875] hover:text-[#d7b875]">
                {t("footerOrderWolt")}
              </Link>

              <Link href="/reservation" className="block rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold transition hover:border-[#d7b875] hover:text-[#d7b875]">
                {t("footerReservation")}
              </Link>

              <Link href="/menu" className="block rounded-full bg-[#c9a45c] px-5 py-3 text-center text-sm font-black text-[#3b1f18] transition hover:bg-[#d7b875]">
                {t("footerOrderOnline")}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-white/50">
          {t("footerCopyright")}
        </div>
      </div>
    </footer>
  );
}