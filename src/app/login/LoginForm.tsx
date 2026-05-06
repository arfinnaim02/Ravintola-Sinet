"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

export default function LoginForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed.");
      }

      router.push(next);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4eee4] px-4 py-12">
      <section className="mx-auto max-w-md overflow-hidden rounded-[2rem] border border-[#ddcfba] bg-white shadow-2xl shadow-[#3b1f18]/10">
        <div className="bg-[#1b0e0a] px-6 py-8 text-center text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.42em] text-[#d7b875]">
            Ravintola Sinet
          </p>
          <h1 className="mt-3 font-display text-4xl font-black">
            {t("loginTitle")}
          </h1>
          <p className="mt-3 text-sm text-white/70">{t("loginSubtitle")}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 p-6">
          <input
            name="email"
            type="email"
            required
            placeholder={t("emailAddress")}
            className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
          />

          <input
            name="password"
            type="password"
            required
            placeholder={t("password")}
            className="w-full rounded-2xl border border-[#d8c9ac] bg-[#fffaf3] px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
          />

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="sinet-gold-button w-full disabled:opacity-60"
          >
            {loading ? t("signingIn") : t("login")}
          </button>

          <p className="text-center text-sm text-[#7b6255]">
            {t("noAccount")}{" "}
            <Link
              href={`/signup?next=${encodeURIComponent(next)}`}
              className="font-black text-[#3b1f18] underline underline-offset-4"
            >
              {t("createOne")}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}