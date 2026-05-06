"use client";

import Link from "next/link";
import { useLanguage } from "../../i18n/LanguageContext";
import ContactForm from "../../components/ContactForm";



export default function AboutPage() {
  const { t } = useLanguage();

  const features = [
    {
      title: t("aboutFeatureFreshTitle"),
      text: t("aboutFeatureFreshText"),
      image: "/about/feature_ingredients.jpg",
    },
    {
      title: t("aboutFeatureDiningTitle"),
      text: t("aboutFeatureDiningText"),
      image: "/about/feature_dining.jpg",
    },
    {
      title: t("aboutFeatureKitchenTitle"),
      text: t("aboutFeatureKitchenText"),
      image: "/about/feature_kitchen.jpg",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4eee4]">
      <section className="relative overflow-hidden bg-[#1b0e0a]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url('/about/hero_restaurant.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1b0e0a]/70 via-[#1b0e0a]/80 to-[#1b0e0a]" />

        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#d7b875]">
            {t("aboutHeroEyebrow")}
          </p>
          <h1 className="mt-5 font-script text-[82px] leading-none sm:text-[120px]">
            Ravintola Sinet
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            {t("aboutHeroText")}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:grid-cols-[1fr_0.9fr]">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-[#3b1f18]/10">
          <img
            src="/about/about_pizza.jpg"
            alt="Ravintola Sinet pizza"
            className="h-full min-h-[360px] w-full object-cover"
          />
        </div>

        <div className="flex items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#b09876]">
              {t("aboutStoryEyebrow")}
            </p>
            <h2 className="mt-3 font-display text-4xl font-black text-[#3b1f18]">
              {t("aboutStoryTitle")}
            </h2>
            <p className="mt-6 text-sm leading-7 text-[#7b6255]">
              {t("aboutStoryText")}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/menu" className="sinet-gold-button text-center">
                {t("exploreMenu")}
              </Link>
              <Link
                href="/reservation"
                className="rounded-full border border-[#d8c9ac] px-6 py-3 text-center text-sm font-black text-[#3b1f18]"
              >
                {t("makeReservation")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="overflow-hidden rounded-[1.75rem] bg-white shadow-xl shadow-[#3b1f18]/10"
            >
              <img
                src={feature.image}
                alt={feature.title}
                className="h-56 w-full object-cover"
              />
              <div className="p-6">
                <h3 className="font-display text-2xl font-black text-[#3b1f18]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#7b6255]">
                  {feature.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid overflow-hidden rounded-[2rem] border border-[#e0d3bf] bg-white shadow-2xl shadow-[#3b1f18]/10 lg:grid-cols-[1fr_0.9fr]">
          <div className="bg-[#1b0e0a] p-8 text-white sm:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d7b875]">
              {t("aboutQualityEyebrow")}
            </p>
            <h2 className="mt-3 font-display text-3xl font-black">
              {t("aboutQualityTitle")}
            </h2>
            <p className="mt-5 text-sm leading-7 text-white/70">
              {t("aboutQualityText")}
            </p>

            <a
              href="/about/oiva-certificate.pdf"
              target="_blank"
              className="mt-7 inline-block rounded-full bg-[#c9a45c] px-6 py-3 text-sm font-black text-[#3b1f18]"
            >
              {t("viewOivaCertificate")}
            </a>
          </div>

          <div className="bg-[#fffaf3] p-8 sm:p-10">
            <img
              src="/about/oiva-certificate.jpg"
              alt="Oiva certificate"
              className="mx-auto max-h-[420px] rounded-2xl border border-[#e0d3bf] object-contain shadow-xl"
            />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-20">
  <div className="grid overflow-hidden rounded-[2rem] border border-[#e0d3bf] bg-white shadow-2xl shadow-[#3b1f18]/10 lg:grid-cols-2">

    {/* LEFT — CONTACT INFO */}
    <div className="bg-[#1b0e0a] p-8 text-white sm:p-10">
      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d7b875]">
        {t("contact")}
      </p>

      <h2 className="mt-3 font-display text-3xl font-black">
        {t("contactTitle")}
      </h2>

      <p className="mt-5 text-sm leading-7 text-white/70">
        {t("contactText")}
      </p>

      <div className="mt-6 space-y-4 text-sm">
        <div>
          <p className="font-black text-white">{t("address")}</p>
          <p className="text-white/70">
            Kauppakatu 28, Joensuu, Finland
          </p>
        </div>

        <div>
          <p className="font-black text-white">{t("phone")}</p>
          <a
            href="tel:+358504557367"
            className="text-white/80 underline"
          >
            +358504557367
          </a>
        </div>

        <div>
          <p className="font-black text-white">{t("email")}</p>
          <p className="text-white/70">
            ravintolasinetisomyy@gmail.com
          </p>
        </div>
      </div>
    </div>

    {/* RIGHT — CONTACT FORM */}
    <div className="bg-[#fffaf3] p-8 sm:p-10">
      <h3 className="font-display text-2xl font-black text-[#3b1f18]">
        {t("sendMessage")}
      </h3>

        <ContactForm />
        
    </div>

  </div>
</section>
    </main>
  );
}