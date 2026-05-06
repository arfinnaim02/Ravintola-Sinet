import "../styles/globals.css";
import type { Metadata } from "next";
import { Allura, Playfair_Display, Inter } from "next/font/google";
import SiteShell from "../components/SiteShell";
import { LanguageProvider } from "../i18n/LanguageContext";

const allura = Allura({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Ravintola Sinet – Pizza, Kebab & Food Delivery in Joensuu",
  description:
    "Ravintola Sinet in Joensuu. Order pizza, kebab, burgers and fresh dishes online. Located at Kauppakatu 28, Joensuu, Finland.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${allura.variable} ${playfair.variable} ${inter.variable} flex min-h-screen flex-col bg-[#f4eee4] text-[#3b1f18] antialiased`}
      >
        <LanguageProvider>
          <SiteShell>{children}</SiteShell>
        </LanguageProvider>
      </body>
    </html>
  );
}