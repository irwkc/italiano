import type { Metadata, Viewport } from "next";
import { Geist, Cormorant_Garamond, Italianno } from "next/font/google";
import { CookieBanner } from "@/components/cookie-banner";
import { JsonLd } from "@/components/json-ld";
import { operator } from "@/lib/legal";
import "./globals.css";

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
});

const script = Italianno({
  variable: "--font-script",
  weight: "400",
  subsets: ["latin"],
});

const title = "Джакомо Скиавон — итальянский с носителем из Новары | Giacomo Schiavon";
const description =
  "Джакомо Скиавон (Giacomo Schiavon) — носитель итальянского из Новары. Онлайн-уроки итальянского: от латыни до первой фразы.";

export const metadata: Metadata = {
  metadataBase: new URL(operator.sites[0]),
  title: {
    default: title,
    template: "%s · Giacomo Schiavon",
  },
  description,
  keywords: [
    "Джакомо Скиавон",
    "Джакомо Скьявон",
    "Giacomo Schiavon",
    "Giacomo",
    "итальянский с носителем",
    "уроки итальянского онлайн",
    "итальянский из Новары",
  ],
  authors: [{ name: "Giacomo Schiavon" }],
  creator: "Giacomo Schiavon",
  alternates: {
    canonical: "/",
    languages: { ru: operator.sites[0] },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: operator.sites[0],
    siteName: "Giacomo Schiavon",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ece6d8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${sans.variable} ${serif.variable} ${script.variable} h-full`}
    >
      <body className="min-h-full bg-ivory text-ink">
        <JsonLd />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
