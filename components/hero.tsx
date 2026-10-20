"use client";

import { useEffect, useRef } from "react";
import { ArrowDownRight } from "@phosphor-icons/react/dist/ssr";
import { gsap, REDUCED } from "@/lib/gsap";
import { hero, site } from "@/lib/content";

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
      gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .fromTo(".h-letter", { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: 0.055 }, 0.2)
        .to(".h-script", { "--w": 0, duration: 1.6, ease: "power2.inOut" }, 0.9)
        .fromTo(".h-label", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, 1.4)
        .fromTo(".h-title", { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 1.6);

      // Лёгкий параллакс заголовка при уходе
      gsap.to(".h-word", {
        yPercent: -18,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".h-script", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={ref}
      id="top"
      data-year="753 a.C."
      className="relative min-h-[100dvh] overflow-hidden"
      aria-label="Начало"
    >
      {/* Гигантская капитель, уходит за края */}
      <h1
        data-menu-word="ITALIANO"
        className="h-word caps absolute left-1/2 -translate-x-1/2 top-[13vh] md:top-[11vh] whitespace-nowrap text-ink select-none"
        style={{ fontSize: "clamp(4.25rem, 19.6vw, 25rem)" }}
      >
        {hero.word.split("").map((ch, i) => (
          <span key={i} className="inline-block overflow-hidden align-bottom">
            <span className="h-letter inline-block will-change-transform">{ch}</span>
          </span>
        ))}
      </h1>

      {/* Каллиграфия, пишется при загрузке */}
      <p
        className="h-script script write absolute right-[4vw] md:right-[6vw] top-[36vh] md:top-[34vh] text-pompei whitespace-nowrap select-none"
        style={{ fontSize: "clamp(3.75rem, 11.5vw, 15rem)" }}
      >
        {hero.script}
      </p>

      {/* Рассыпанные подписи */}
      {hero.labels.map((l) => (
        <span
          key={l.text}
          className="h-label label absolute hidden md:block max-w-[14ch]"
          style={{ left: `${l.x}%`, top: `${l.y}%` }}
        >
          {l.text}
        </span>
      ))}

      {/* Заголовок и действие */}
      <div className="absolute left-5 md:left-10 bottom-[18vh] md:bottom-[16vh] max-w-[34rem]">
        <h2 className="h-title serif text-[1.75rem] md:text-[2.5rem] leading-[1.05]">
          {hero.title}
          <br />
          <em className="text-ink-soft">{hero.subtitle}</em>
        </h2>
        <a href="#contatti" className="h-title btn btn-primary mt-8">
          {site.cta}
          <ArrowDownRight size={14} weight="light" />
        </a>
      </div>
    </section>
  );
}
