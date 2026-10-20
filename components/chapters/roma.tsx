"use client";

import { useEffect, useRef } from "react";
import { gsap, MOTION_OK } from "@/lib/gsap";
import { roma } from "@/lib/content";

/** Глава I. Латынь превращается в итальянский, пока "ROMA" наполняется чернилами. */
export function Roma() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          pin: ".r-pin",
          pinSpacing: false,
        },
      });

      tl.fromTo(
        ".r-fill",
        { clipPath: "inset(100% -0.12em -0.12em -0.12em)" },
        { clipPath: "inset(-0.12em -0.12em -0.12em -0.12em)", ease: "none", duration: 1 },
        0,
      );

      root.querySelectorAll<HTMLElement>(".r-pair").forEach((pair, i) => {
        const at = 0.08 + i * 0.17;
        tl.to(pair.querySelector(".r-la"), { yPercent: -40, opacity: 0, duration: 0.08, ease: "power2.in" }, at);
        tl.to(pair.querySelector(".r-it"), { "--w": 0, duration: 0.14, ease: "power2.inOut" }, at + 0.02);
      });
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(".r-fill", { clipPath: "inset(-0.12em -0.12em -0.12em -0.12em)" });
      gsap.set(".r-la", { opacity: 0 });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={ref} id="storia" data-year={roma.year} className="relative h-[320vh]" aria-label="Рим">
      <div className="r-pin relative h-[100dvh] overflow-hidden">
        {/* ROMA: контур и наполнение */}
        <div
          data-menu-word="ROMA"
          className="caps absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap"
          style={{ fontSize: "clamp(6rem, 30vw, 36rem)" }}
          aria-hidden
        >
          <span className="caps-outline block">{roma.word}</span>
          <span className="r-fill absolute inset-0 block" style={{ clipPath: "inset(100% -0.12em -0.12em -0.12em)" }}>
            {roma.word}
          </span>
        </div>

        {/* Пары слов: латынь сверху, итальянский пишется поверх */}
        {roma.pairs.map((p) => (
          <div
            key={p.la}
            className="r-pair absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <span className="r-la caps block text-[1.1rem] md:text-[1.6rem] tracking-[0.08em] text-ink-soft">
              {p.la}
            </span>
            <span
              className="r-it script write absolute left-0 -top-[0.35em] text-pompei text-[2.6rem] md:text-[4.5rem]"
            >
              {p.it}
            </span>
          </div>
        ))}

        {/* Текст главы */}
        <div className="absolute right-5 md:right-10 bottom-[12vh] md:bottom-[14vh] max-w-[26rem] text-right">
          <h2 className="reveal serif text-[1.6rem] md:text-[2.25rem]">{roma.title}</h2>
          <p className="reveal mt-4 text-[0.95rem] md:text-base text-ink-soft leading-relaxed">{roma.body}</p>
        </div>
      </div>
    </section>
  );
}
