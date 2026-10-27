import Link from "next/link";
import { legalNav, operator } from "@/lib/legal";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="legal-shell">
      <header className="legal-bar">
        <Link href="/" className="label text-ink">
          {operator.nameEn}
          <span className="block text-ink-soft">{operator.nameRu}</span>
        </Link>
        <Link href="/" className="script text-[1.55rem] leading-none text-pompei" aria-label="На главную">
          G
        </Link>
      </header>
      {children}
      <nav className="legal-links" aria-label="Документы">
        {legalNav.map((item) => (
          <Link key={item.href} href={item.href} className="link">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
