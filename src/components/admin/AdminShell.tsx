"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navGroups = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin/dashboard" }],
  },
  {
    title: "Homepage",
    items: [
      { label: "Hero Banners", href: "/admin/banners" },
      { label: "Reviews", href: "/admin/reviews" },
      { label: "Popups", href: "/admin/popups" },
    ],
  },
  {
    title: "Menu Management",
    items: [
      { label: "Categories", href: "/admin/categories" },
      { label: "Menu Items", href: "/admin/menu-items" },
      { label: "Addon Groups", href: "/admin/addons" },
      { label: "Assign Addons", href: "/admin/assign-addons" },
    ],
  },
  {
    title: "Orders",
    items: [
      { label: "Delivery Orders", href: "/admin/orders" },
      { label: "Reservations", href: "/admin/reservations" },
      { label: "Coupons", href: "/admin/coupons" },
      { label: "Loyalty Rewards", href: "/admin/loyalty" },
      { label: "Promotions", href: "/admin/promotions" },
      { label: "Delivery Pricing", href: "/admin/delivery-pricing" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Contact Messages", href: "/admin/messages" },
      { label: "Telegram Logs", href: "/admin/telegram-logs" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const SidebarContent = (
    <>
      <div className="border-b border-white/10 px-5 py-6">
        <Link
          href="/admin/dashboard"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3"
        >
          <img
            src="/logo/logo.jpg"
            alt="Ravintola Sinet"
            className="h-12 w-auto object-contain"
          />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#d7b875]">
              Admin Panel
            </p>
            <p className="font-display text-xl font-black text-white">
              Sinet Control
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.28em] text-white/35">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block rounded-2xl px-4 py-3 text-sm font-bold transition ${
                        active
                          ? "bg-[#d7b875] text-[#3b1f18] shadow-lg shadow-black/10"
                          : "text-white/78 hover:bg-white/10 hover:text-[#d7b875]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <Link
          href="/"
          target="_blank"
          className="mb-3 block rounded-2xl border border-white/15 px-4 py-3 text-center text-sm font-bold text-white/80 transition hover:border-[#d7b875] hover:text-[#d7b875]"
        >
          View Website
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/85 transition hover:bg-white/15"
        >
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f4eee4]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-76 flex-col bg-[#3b1f18] text-white shadow-2xl lg:flex lg:w-72">
        {SidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/60"
          />

          <aside className="absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-[#3b1f18] text-white shadow-2xl">
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:ml-72">
        <header className="sticky top-0 z-40 border-b border-[#ddcfba] bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ddcfba] text-xl font-black text-[#3b1f18] lg:hidden"
                aria-label="Open admin menu"
              >
                ☰
              </button>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b09876]">
                  Logged in as
                </p>
                <h2 className="font-display text-xl font-black text-[#3b1f18]">
                  Sinet Admin
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                target="_blank"
                className="hidden rounded-full border border-[#d8c9ac] px-4 py-2 text-sm font-bold text-[#3b1f18] transition hover:border-[#c9a45c] md:block"
              >
                View Site
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-[#3b1f18] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#5a3025]"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}