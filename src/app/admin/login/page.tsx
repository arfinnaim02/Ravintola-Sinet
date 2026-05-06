"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1b0e0a] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#d7b875]/25 bg-[#f4eee4] p-7 shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#b09876]">
          Ravintola Sinet
        </p>

        <h1 className="mt-3 font-display text-3xl font-black text-[#3b1f18]">
          Admin Login
        </h1>

        <p className="mt-2 text-sm text-[#7b6255]">
          Enter admin password to manage menu, banners, addons and orders.
        </p>

        <form onSubmit={handleLogin} className="mt-7 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-black text-[#3b1f18]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-[#d8c9ac] bg-white px-4 py-3 text-sm outline-none focus:border-[#c9a45c] focus:ring-4 focus:ring-[#c9a45c]/15"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="sinet-gold-button w-full disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}