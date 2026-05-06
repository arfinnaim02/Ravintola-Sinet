"use client";

import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

export default function ContactForm() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setLoading(true);
    setStatus("");
    setSuccess(false);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send message.");
      }

      setSuccess(true);
      setStatus("Message sent successfully.");
      form.reset();
    } catch (error: any) {
      setSuccess(false);
      setStatus(error?.message || "Failed to send message.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <input
        name="name"
        required
        placeholder={t("contactNamePlaceholder")}
        className="w-full rounded-xl border border-[#d8c9ac] bg-white px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
      />

      <input
        name="email"
        type="email"
        required
        placeholder="Your Email"
        className="w-full rounded-xl border border-[#d8c9ac] bg-white px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
      />

      <textarea
        name="message"
        required
        placeholder="Your Message"
        className="min-h-[120px] w-full rounded-xl border border-[#d8c9ac] bg-white px-4 py-3 text-sm outline-none focus:border-[#c9a45c]"
      />

      {status && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-bold ${
            success
              ? "border border-green-200 bg-green-50 text-green-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {status}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="sinet-gold-button w-full disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}