"use client";

import { useEffect, useRef } from "react";
import { gsap, MOTION_OK, PHONE } from "@/lib/gsap";
import { formats } from "@/lib/content";

const offsets = ["lg:mt-0", "lg:mt-[22vh]", "lg:mt-[44vh]"];
const starts = ["lg:col-start-1", "lg:col-start-5", "lg:col-start-9"];

/** Форматы уроков. На мобилке LEZIONI выезжает справа к центру. */
export function Formats() {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = section.current;
    if (!root) return;
    const word = root.querySelector<HTMLElement>(".l-word-m");
    if (!word) return;
    const mm = gsap.matchMedia();
    mm.add(`${MOTION_OK} and ${PHONE}`, () => {
      gsap.fromTo(
        word,
        { x: "55vw" },
        {
          x: "0vw",
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top 85%",
            end: "top 28%",
            scrub: 0.65,
          },
        },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={section}
      id="lezioni"
      data-year="Oggi"
      className="relative pt-14 pb-16 md:pt-[14vh] md:pb-[22vh] overflow-hidden"
      aria-label="Форматы уроков"
    >
      {/* Phone: стартует справа, параллаксом к центру */}
      <div className="l-word-m absolute top-[1vh] left-1/2 -translate-x-1/2 will-change-transform md:hidden">
        <span
          data-menu-word="LEZIONI"
          className="caps block text-ink select-none whitespace-nowrap leading-[0.8]"
          style={{ fontSize: "clamp(3.4rem, 22vw, 6rem)" }}
          aria-hidden
        >
          {formats.word}
        </span>
      </div>

      {/* Desktop: как было — справа */}
      <span
        data-menu-word="LEZIONI"
        className="caps absolute -right-[5vw] top-[2vh] hidden md:block text-ink select-none whitespace-nowrap leading-[0.8]"
        style={{ fontSize: "clamp(3.2rem, 20vw, 34rem)" }}
        aria-hidden
      >
        {formats.word}
      </span>

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-12 md:gap-y-16 px-5 md:px-10 mt-20 md:mt-[min(42vw,11rem)] lg:mt-[22vw]">
        {formats.items.map((f, i) => (
          <article key={f.name} className={`lg:col-span-4 ${starts[i]} ${offsets[i]}`}>
            <span className="reveal label block mb-5 text-pompei">{f.name}</span>
            <ul className="caps text-[1.6rem] md:text-[2.1rem] leading-[1.05] text-ink">
              {f.lines.map((l) => (
                <li key={l} className="reveal">
                  {l}
                </li>
              ))}
            </ul>
            <p className="reveal mt-6 text-ink-soft text-[0.95rem] leading-relaxed max-w-[24rem]">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
