import type { Metadata, Viewport } from "next";
import { Geist, Cormorant_Garamond, Italianno } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Giacomo. Итальянский с носителем из Новары",
  description:
    "Путь от латыни до вашей первой фразы по-итальянски. Индивидуальные онлайн-уроки с носителем.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${sans.variable} ${serif.variable} ${script.variable} h-full`}
    >
      <body className="min-h-full bg-ivory text-ink">{children}</body>
    </html>
  );
}
