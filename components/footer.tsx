"use client";

import type { MouseEvent } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { PhoneDrift } from "@/components/phone-drift";
import Link from "next/link";
import { CookieSettingsLink } from "@/components/cookie-banner";
import { footer } from "@/lib/content";
import { legalNav } from "@/lib/legal";
import { getLenis } from "@/lib/lenis-store";
import { REDUCED } from "@/lib/gsap";

function goTop(e: MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  const reduced = window.matchMedia(REDUCED).matches;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo("#top", { duration: reduced ? 0 : 1.2 });
  else document.querySelector("#top")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden pt-8 pb-[max(5.5rem,calc(10vh+env(safe-area-inset-bottom)))] md:pt-[6vh] md:pb-[12vh]" aria-label="Подвал">
      <PhoneDrift from={16} to={-12}>
        <div
          data-menu-word="A PRESTO"
          data-menu-solid
          className="caps w-full text-center whitespace-nowrap select-none text-ink leading-[0.8]"
          style={{ fontSize: "clamp(4.2rem, 22vw, 30rem)" }}
          aria-hidden
        >
          {footer.word}
        </div>
      </PhoneDrift>
      <div className="grid grid-cols-12 gap-4 px-5 md:px-10 mt-8 md:mt-12 label items-center">
        <div className="col-span-3">MMXXVI</div>
        <div className="col-span-6 md:col-span-3 md:col-start-7">
          <a
            href={footer.creditHref}
            target="_blank"
            rel="noreferrer"
            className="link inline-flex min-h-11 flex-col justify-center normal-case tracking-normal"
            style={{ color: "var(--pompei)" }}
          >
            <span className="serif font-medium text-[1.05rem] leading-[1.1] md:text-[1.35rem]">
              {footer.credit}
            </span>
            <span className="script text-[0.95rem] leading-none md:text-[1.1rem] mt-[0.12em]">
              {footer.creditNote}
            </span>
          </a>
        </div>
        <div className="col-span-3 flex justify-end">
          <a
            href="#top"
            onClick={goTop}
            className="inline-flex min-h-11 min-w-11 items-center justify-end text-ink transition-colors duration-200 ease-out hover:text-pompei active:scale-[0.97]"
            aria-label="Наверх"
          >
            <ArrowUpRight size={22} weight="light" />
          </a>
        </div>
      </div>
      <div className="footer-legal px-5 md:px-10 mt-8 md:mt-10">
        <p className="footer-offer">
          Сайт носит ознакомительный характер и не является публичной офертой.
        </p>
        <nav className="footer-docs" aria-label="Юридическая информация">
          {legalNav.map((item) => (
            <Link key={item.href} href={item.href} className="link">
              {item.label}
            </Link>
          ))}
          <CookieSettingsLink />
        </nav>
      </div>
    </footer>
  );
}
