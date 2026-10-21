"use client";

import { useEffect, useRef } from "react";
import { ParallaxField } from "@/components/parallax-field";
import { oggi } from "@/lib/content";
import { gsap, MOTION_OK, PHONE } from "@/lib/gsap";

const phoneWords = [
  { text: "Allora", x: 4, y: 16, speed: 0.55, size: 12, red: false, edge: true },
  { text: "Dai!", x: 58, y: 2, speed: 1.5, size: 15, red: true },
  { text: "Boh", x: 6, y: 28, speed: 0.9, size: 17, red: false },
  { text: "Magari", x: 54, y: 26, speed: 0.35, size: 9, red: false },
  { text: "Andiamo", x: 2, y: 62, speed: 1.2, size: 11, red: false },
  { text: "Figurati", x: 48, y: 58, speed: 0.65, size: 10, red: false },
  { text: "Mamma mia", x: 18, y: 84, speed: 1.35, size: 11, red: true },
];

/** Глава IV. Сегодняшняя Италия: разговорные словечки рассыпаны и едут с разной скоростью. */
export function Oggi() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = root.current;
    if (!wrap) return;
    const field = wrap.firstElementChild as HTMLElement | null;
    if (!field) return;
    const mm = gsap.matchMedia();
    mm.add(`${MOTION_OK} and ${PHONE}`, () => {
      const allora = field.querySelector<HTMLElement>("[data-oggi-edge]");
      if (!allora) return;
      gsap.set(allora, { opacity: 0 });
      const tl = gsap.timeline({
        defaults: { ease: "none", force3D: false },
        scrollTrigger: {
          trigger: field,
          start: "top 78%",
          end: "bottom 12%",
          scrub: true,
        },
      });
      tl.fromTo(allora, { opacity: 0 }, { opacity: 1, duration: 0.22 });
      tl.to(allora, { opacity: 1, duration: 0.56 });
      tl.to(allora, { opacity: 0, duration: 0.22 });
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={root}>
      <ParallaxField
        data-year={oggi.year}
        className="relative h-[118vh] md:h-[200vh]"
        range={240}
      >
        {phoneWords.map((w) => (
          <span
            key={`m-${w.text}`}
            data-speed={w.speed}
            {...(w.edge ? { "data-oggi-edge": "" } : {})}
            className="absolute whitespace-nowrap select-none will-change-transform md:hidden"
            style={{ left: `${w.x}%`, top: `${w.y}%` }}
            aria-hidden
          >
            <span
              className={`script block ${w.red ? "text-pompei" : "text-ink"}`}
              style={{ fontSize: `clamp(2.1rem, ${w.size}vw, 3.8rem)` }}
            >
              {w.text}
            </span>
          </span>
        ))}

        {oggi.words.map((w) => (
          <span
            key={w.text}
            data-speed={w.speed}
            className="absolute hidden md:block whitespace-nowrap select-none will-change-transform"
            style={{ left: `${w.x}%`, top: `${w.y}%` }}
            aria-hidden
          >
            <span
              className={`script block pr-[0.3em] ${w.red ? "text-pompei" : "text-ink"}`}
              style={{
                fontSize: `clamp(2.5rem, ${w.size}vw, ${w.size * 1.1}rem)`,
                translate: `min(0px, calc(97vw - 100% - ${w.x}vw))`,
              }}
            >
              {w.text}
            </span>
          </span>
        ))}

        <div className="absolute z-20 left-5 right-5 top-[40%] md:hidden">
          <h2 className="serif text-[1.5rem] leading-[1.08] pb-1">{oggi.title}</h2>
          <p className="mt-3 serif italic text-[1.2rem] leading-[1.15] text-pompei pb-1">{oggi.body}</p>
        </div>
      </ParallaxField>
    </div>
  );
}
