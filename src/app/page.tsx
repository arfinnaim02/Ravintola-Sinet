"use client";

import Hero from "../components/Hero";
import Link from "next/link";
import HomeFavorites from "../components/HomeFavorites";
import { useLanguage } from "../i18n/LanguageContext";
export default function HomePage() {
  const { t } = useLanguage();
  const mapQuery = "Ravintola Sinet, Kauppakatu 28, Joensuu, Finland";

  return (
    <div className="bg-[#f4eee4]">
      <Hero />

      <section className="border-y border-[#d8c9ac] bg-[#f4eee4]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div className="text-center">
            <h3 className="font-serif text-2xl font-semibold text-[#3b1f18]">
              {t("homeFreshTitle")}
            </h3>
            <p className="mt-1 text-[#7b6255]">{t("homeFreshText")}</p>
          </div>

          <div className="text-center">
            <h3 className="font-serif text-2xl font-semibold text-[#3b1f18]">
              {t("homeOpenTitle")}
            </h3>
            <p className="mt-1 text-[#7b6255]">Welcome every day.</p>
          </div>

          <div className="text-center">
            <h3 className="font-serif text-2xl font-semibold text-[#3b1f18]">
              {t("homeDoughTitle")}
            </h3>
            <p className="mt-1 text-[#7b6255]">{t("homeDoughText")}</p>
          </div>
        </div>
      </section>

      <HomeFavorites />

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid overflow-hidden rounded-[2rem] border border-[#e0d3bf] bg-white shadow-2xl shadow-[#3b1f18]/10 md:grid-cols-2">
          <div className="min-h-[320px] overflow-hidden bg-[#ddd2bd] md:min-h-[420px]">
            <iframe
              title="Ravintola Sinet location map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                mapQuery
              )}&output=embed`}
              className="h-full min-h-[320px] w-full border-0 md:min-h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div className="bg-[#eee6d8] p-8 sm:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
              {t("homeFindUs")}
            </p>

            <h2 className="mt-3 font-display text-3xl font-black text-[#3b1f18]">
              {t("homeVisitTitle")}
            </h2>

            <p className="mt-6 text-sm font-black text-[#3b1f18]">{t("address")}</p>
            <p className="mt-2 text-sm leading-6 text-[#7b6255]">
              Kauppakatu 28, ISO MYY 2nd Floor, Opposite of Tapio Cinema Center,
              Joensuu, 80100.
            </p>

            <p className="mt-6 text-sm font-black text-[#3b1f18]">{t("phone")}</p>
            <a
              href="tel:+358504557367"
              className="mt-2 block text-sm font-bold text-[#3b1f18] underline underline-offset-4"
            >
              +358504557367
            </a>

            <Link
              href="https://maps.app.goo.gl/mzgvAhVgjo4j2fNb9"
              target="_blank"
              className="mt-8 inline-block rounded-full bg-[#c9a45c] px-6 py-3 text-sm font-black text-[#3b1f18] shadow-lg shadow-[#3b1f18]/10"
            >
              {t("getDirections")} →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}