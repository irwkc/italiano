"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/** Фиксированная "дата" слева внизу. Меняется, когда глава с data-year проходит через центр экрана. */
export function YearMark() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let current = el.textContent ?? "";
    const setYear = (y: string) => {
      if (y === current) return;
      current = y;
      gsap
        .timeline()
        .to(el, { yPercent: -60, opacity: 0, duration: 0.25, ease: "power2.in" })
        .add(() => {
          el.textContent = y;
        })
        .fromTo(el, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: "power3.out" });
    };

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-year]").forEach((section) => {
        const y = section.dataset.year ?? "";
        ScrollTrigger.create({
          trigger: section,
          start: "top 55%",
          end: "bottom 55%",
          onEnter: () => setYear(y),
          onEnterBack: () => setYear(y),
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="fixed left-5 bottom-5 md:left-10 md:bottom-8 z-40 pointer-events-none mix-blend-multiply">
      <span className="label block mb-1">anno</span>
      <span ref={ref} className="caps block text-[1.75rem] md:text-[2.5rem] text-ink">
        753 a.C.
      </span>
    </div>
  );
}
