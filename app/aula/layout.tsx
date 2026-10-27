import type { Metadata } from "next";
import "./aula.css";

export const metadata: Metadata = {
  title: "Aula · Giacomo",
  description: "Кабинет преподавателя и ученика.",
  robots: { index: false, follow: false },
};

export default function AulaLayout({ children }: { children: React.ReactNode }) {
  return <div className="aula">{children}</div>;
}
