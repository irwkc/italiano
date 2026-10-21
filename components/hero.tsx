"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { ArrowDownRight } from "@phosphor-icons/react/dist/ssr";
import { gsap, REDUCED, MOTION_OK, PHONE, DESK } from "@/lib/gsap";
import { hero, site } from "@/lib/content";

function LetterRow({ text, className = "", style }: { text: string; className?: string; style?: CSSProperties }) {
  return (
    <span data-menu-line className={`block overflow-hidden ${className}`} style={style}>
      {text.split("").map((ch, i) => (
        <span key={`${ch}-${i}`} className="inline-block overflow-hidden align-bottom">
          <span className="h-letter inline-block will-change-transform">{ch}</span>
        </span>
      ))}
    </span>
  );
}

const PHONE_ITA =
  "min(48vw, calc((100svh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 7rem) / 2.55))";
const PHONE_LI =
  "min(72vw, calc((100svh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 7rem) / 1.7))";

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia(REDUCED).matches) {
      gsap.set(root.querySelectorAll(".h-in"), { opacity: 1, y: 0, yPercent: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      const visible = (sel: string) =>
        gsap.utils.toArray<HTMLElement>(sel).filter((el) => el.getClientRects().length > 0);

      gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .fromTo(visible(".h-letter"), { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.055 }, 0.2)
        .to(visible(".h-script"), { "--w": 0, duration: 1.6, ease: "power2.inOut" }, 0.9)
        .fromTo(visible(".h-label"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, 1.4)
        .fromTo(visible(".h-title"), { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 1.6);

    }, root);

    const mm = gsap.matchMedia();
    mm.add(`${MOTION_OK} and ${DESK}`, () => {
      gsap.to(root.querySelectorAll(".h-word"), {
        yPercent: -18,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(root.querySelectorAll(".h-script"), {
        yPercent: 30,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
      });
    });
    mm.add(`${MOTION_OK} and ${PHONE}`, () => {
      gsap.to(root.querySelector(".h-stack"), {
        yPercent: -8,
        ease: "none",
        force3D: true,
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
      });
    });
    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={ref}
      id="top"
      data-year="753 a.C."
      className="relative min-h-[100dvh] overflow-hidden"
      aria-label="Начало"
    >
      {/* Phone: ITA / LI / ANO / con Giacomo — строки на всю ширину */}
      <div className="h-stack absolute inset-x-0 top-[calc(env(safe-area-inset-top)+3.05rem)] px-0 md:hidden">
        <h1
          data-menu-word="ITALIANO"
          className="h-word caps text-ink select-none leading-[0.74] pl-[0.02em]"
          style={{ fontSize: PHONE_ITA }}
        >
          <LetterRow text="ITA" style={{ fontSize: PHONE_ITA, letterSpacing: "-0.055em" }} />
          <LetterRow
            text="LI"
            className="-mt-[0.06em]"
            style={{ fontSize: PHONE_LI, letterSpacing: "-0.06em" }}
          />
          <LetterRow
            text="ANO"
            className="-mt-[0.07em]"
            style={{ fontSize: PHONE_ITA, letterSpacing: "-0.055em" }}
          />
        </h1>
        <p
          className="h-script script write mt-2 ml-[7vw] text-pompei select-none"
          style={{ fontSize: "clamp(2.5rem, 14vw, 4rem)", display: "block" }}
        >
          {hero.script}
        </p>
      </div>

      {/* Desktop: one-line ITALIANO + script */}
      <h1
        data-menu-word="ITALIANO"
        className="h-word caps absolute left-1/2 -translate-x-1/2 top-[11vh] hidden md:block whitespace-nowrap text-ink select-none"
        style={{ fontSize: "clamp(3.7rem, 21vw, 25rem)" }}
      >
        {hero.word.split("").map((ch, i) => (
          <span key={i} className="inline-block overflow-hidden align-bottom">
            <span className="h-letter inline-block will-change-transform">{ch}</span>
          </span>
        ))}
      </h1>

      <p
        className="h-script script write absolute right-[6vw] top-[34vh] hidden md:block text-pompei whitespace-nowrap select-none"
        style={{ fontSize: "clamp(2.15rem, 11vw, 15rem)" }}
      >
        {hero.script}
      </p>

      {hero.labels.map((l) => (
        <span
          key={l.text}
          className="h-label label absolute hidden md:block max-w-[14ch]"
          style={{ left: `${l.x}%`, top: `${l.y}%` }}
        >
          {l.text}
        </span>
      ))}

      <div className="h-copy absolute left-5 right-5 md:left-10 md:right-auto bottom-[max(0.7rem,env(safe-area-inset-bottom))] md:bottom-[16vh] max-w-[34rem]">
        <h2 className="h-title hidden md:block serif text-[2.5rem] leading-[1.05] pb-1">
          {hero.title}
          <br />
          <em className="text-ink-soft">{hero.subtitle}</em>
        </h2>
        <a href="#contatti" className="h-title btn btn-primary md:mt-8">
          {site.cta}
          <ArrowDownRight size={14} weight="light" />
        </a>
      </div>
    </section>
  );
}
