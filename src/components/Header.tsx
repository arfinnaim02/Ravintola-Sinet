"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "../contexts/CartContext";
import { useLanguage } from "../i18n/LanguageContext";

const navItems = [
  { key: "navHome", href: "/" },
  { key: "navMenu", href: "/menu" },
  { key: "navAbout", href: "/about" },
] as const;

type HeaderUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
};

export default function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  const { totalQuantity, openCart } = useCart();
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await response.json();

        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch {
        setUser(null);
      }
    }

    loadUser();
  }, []);

  function toggleLanguage() {
  setLang(lang === "en" ? "fi" : "en");
}
  async function handleCustomerLogout() {
    await fetch("/api/auth/logout", { method: "POST" });

    setUser(null);
    setAccountOpen(false);
    setOpen(false);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#6b4a3d]/40 bg-[#3b1f18]/95 shadow-xl backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" onClick={() => setOpen(false)}>
          <img
            src="/logo/logo.jpg"
            alt="Ravintola Sinet logo"
            className="h-12 w-auto object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-bold text-white/90 transition hover:text-[#d7b875]"
            >
              {t(item.key)}
            </Link>
          ))}

        </nav>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => setAccountOpen((value) => !value)}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-black text-white/90 transition hover:border-[#d7b875] hover:text-[#d7b875]"
                >
                  {user.name.split(" ")[0]}
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-[#eadfce] bg-white shadow-2xl shadow-black/20">
                    <div className="border-b border-[#eadfce] px-4 py-3">
                      <p className="text-sm font-black text-[#3b1f18]">
                        {user.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-[#7b6255]">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href="/account"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-3 text-sm font-bold text-[#3b1f18] hover:bg-[#fffaf3]"
                    >
                      {t("myAccount")}
                    </Link>

                    <Link
                      href="/account/addresses"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-3 text-sm font-bold text-[#3b1f18] hover:bg-[#fffaf3]"
                    >
                      {t("savedAddresses")}
                    </Link>

                    <Link
                      href="/account/orders"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-3 text-sm font-bold text-[#3b1f18] hover:bg-[#fffaf3]"
                    >
                      {t("myOrders")}
                    </Link>

                    <button
                      type="button"
                      onClick={handleCustomerLogout}
                      className="block w-full border-t border-[#eadfce] px-4 py-3 text-left text-sm font-black text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-black text-white/90 transition hover:border-[#d7b875] hover:text-[#d7b875]"
              >
                {t("login")}
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={openCart}
            className="relative rounded-full border border-[#d7b875]/40 px-4 py-2 text-sm font-black text-[#d7b875] transition hover:bg-[#d7b875] hover:text-[#3b1f18]"
          >
            {t("cart")}
            <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-black text-[#3b1f18]">
              {totalQuantity}
            </span>
          </button>

          <div className="hidden items-center gap-2 md:flex">
          <span
            className={`text-xs font-black transition ${
              lang === "en" ? "text-[#d7b875]" : "text-white/45"
            }`}
          >
            EN
          </span>

          <button
            type="button"
            onClick={toggleLanguage}
            aria-label="Toggle language"
            className="relative flex h-9 w-[70px] items-center rounded-full border border-[#d7b875]/35 bg-white/10 p-1 transition hover:border-[#d7b875]"
          >
            <span
              className={`absolute top-1 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white text-lg shadow-lg transition-all duration-300 ${
                lang === "en" ? "left-1" : "left-[37px]"
              }`}
            >
              {lang === "en" ? "🇬🇧" : "🇫🇮"}
            </span>
          </button>

          <span
            className={`text-xs font-black transition ${
              lang === "fi" ? "text-[#d7b875]" : "text-white/45"
            }`}
          >
            FI
          </span>
        </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white md:hidden"
            aria-label="Toggle menu"
          >
            <span className="text-2xl leading-none">{open ? "×" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#2a1510] px-4 py-5 md:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-bold text-white/90 hover:bg-white/5 hover:text-[#d7b875]"
              >
                {t(item.key)}
              </Link>
            ))}


            
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openCart();
              }}
              className="rounded-lg px-4 py-3 text-left text-sm font-bold text-white/90 hover:bg-white/5 hover:text-[#d7b875]"
            >
              {t("cart")} ({totalQuantity})
            </button>


            <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-bold text-white/90 hover:bg-white/5"
          >
            <span>Language</span>

            <span className="flex items-center gap-3">
              <span className={lang === "en" ? "text-[#d7b875]" : "text-white/45"}>
                EN
              </span>

              <span className="relative flex h-8 w-[62px] items-center rounded-full border border-[#d7b875]/35 bg-white/10 p-1">
                <span
                  className={`absolute top-1 flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-white text-base shadow-lg transition-all duration-300 ${
                    lang === "en" ? "left-1" : "left-[34px]"
                  }`}
                >
                  {lang === "en" ? "🇬🇧" : "🇫🇮"}
                </span>
              </span>

              <span className={lang === "fi" ? "text-[#d7b875]" : "text-white/45"}>
                FI
              </span>
            </span>
          </button>

            {user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-bold text-white/90 hover:bg-white/5 hover:text-[#d7b875]"
                >
                  {t("myAccount")}
                </Link>

                <Link
                  href="/account/addresses"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-bold text-white/90 hover:bg-white/5 hover:text-[#d7b875]"
                >
                  {t("savedAddresses")}
                </Link>

                <Link
                  href="/account/orders"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-bold text-white/90 hover:bg-white/5 hover:text-[#d7b875]"
                >
                  {t("myOrders")}
                </Link>

                <button
                  type="button"
                  onClick={handleCustomerLogout}
                  className="rounded-lg px-4 py-3 text-left text-sm font-bold text-red-300 hover:bg-white/5"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-bold text-white/90 hover:bg-white/5 hover:text-[#d7b875]"
              >
                {t("loginSignup")}
              </Link>
            )}

          </nav>
        </div>
      )}
    </header>
  );
}