"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../i18n/LanguageContext";

type HeroBanner = {
  id: string;
  image: string;
  mobileImage: string | null;
  eyebrow: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonUrl: string;
};

const fallbackSlides: HeroBanner[] = [
  {
    id: "fallback-1",
    image: "/hero/1.webp",
    mobileImage: null,
    eyebrow: "heroEyebrow",
    title: "Ravintola Sinet",
    subtitle: "heroSubtitle",
    buttonText: "orderOnline",
    buttonUrl: "/menu",
  },
];

export default function Hero() {
  const { t } = useLanguage();
  const [slides, setSlides] = useState<HeroBanner[]>(fallbackSlides);
  const [active, setActive] = useState(0);

  useEffect(() => {
    async function loadBanners() {
      try {
        const response = await fetch("/api/hero-banners", { cache: "no-store" });
        const data = await response.json();

        if (response.ok && data.success && data.banners.length > 0) {
          setSlides(data.banners);
        }
      } catch {
        setSlides(fallbackSlides);
      }
    }

    loadBanners();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[active] || fallbackSlides[0];

  return (
    <section className="relative h-[90vh] min-h-[680px] w-full overflow-hidden bg-[#1b0e0a]">
      {slides.map((slide, index) => (
        <div key={slide.id}>
          <div
            className={`absolute inset-0 hidden bg-cover bg-center transition-opacity duration-[1500ms] md:block ${
              index === active ? "opacity-70" : "opacity-0"
            }`}
            style={{ backgroundImage: `url("${slide.image}")` }}
          />

          <div
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] md:hidden ${
              index === active ? "opacity-70" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url("${slide.mobileImage || slide.image}")`,
            }}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-[#1b0e0a]/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1b0e0a]/80 via-transparent to-[#1b0e0a]/90" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <img
          src="/logo/logo.jpg"
          alt="Ravintola Sinet logo"
          className="mb-6 h-16 w-auto object-contain sm:h-20"
        />

        <div className="mb-5 rounded-full border border-[#d7b875]/40 bg-[#3b1f18]/60 px-5 py-2 text-[10px] font-bold tracking-[0.4em] text-[#d7b875] sm:text-xs">
          {current.eyebrow === "heroEyebrow" ? t("heroEyebrow") : current.eyebrow || t("heroEyebrow")}
        </div>

        <h1 className="font-script text-[72px] leading-[0.85] text-white drop-shadow-2xl sm:text-[110px] md:text-[150px]">
          {current.title || "Ravintola Sinet"}
        </h1>

        <p className="mt-6 max-w-xl text-sm leading-7 text-white/85 sm:text-base">
          {current.subtitle === "heroSubtitle" ? t("heroSubtitle") : current.subtitle || t("heroSubtitle")}
        </p>

        <div className="mt-9 grid w-full max-w-[760px] grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/reservation" className="sinet-gold-button">
            {t("makeReservation")}
          </Link>

          <Link href="/menu" className="sinet-outline-button">
            {t("viewMenu")}
          </Link>

          <Link href={current.buttonUrl || "/menu"} className="sinet-gold-button">
            {current.buttonText === "orderOnline" ? t("orderOnline") : current.buttonText || t("orderOnline")}
          </Link>
        </div>

        {slides.length > 1 && (
          <div className="mt-9 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActive(index)}
                className={`h-2 rounded-full transition-all ${
                  index === active ? "w-9 bg-[#d7b875]" : "w-2 bg-white/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}