"use client";

import { useEffect, useRef } from "react";
import { gsap, MOTION_OK, DESK } from "@/lib/gsap";
import { colosseo } from "@/lib/content";
import { Sketch } from "@/components/sketch";

/** Глава II. Камера летит сквозь слово AVE, крики толпы проносятся мимо. Всё типографикой. Только десктоп. */
export function Colosseo() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add(`${MOTION_OK} and ${DESK}`, () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          pin: ".c-pin",
          pinSpacing: false,
        },
      });

      tl.fromTo(".c-ave", { scale: 0.55, opacity: 1 }, { scale: 11, ease: "power2.in", duration: 0.7 }, 0);
      tl.to(".c-ave", { opacity: 0, duration: 0.14, ease: "none" }, 0.44);

      root.querySelectorAll<HTMLElement>(".c-shout").forEach((el) => {
        const s = parseFloat(el.dataset.s ?? "1");
        const dx = (parseFloat(el.dataset.x ?? "50") - 50) / 50;
        const dy = (parseFloat(el.dataset.y ?? "50") - 50) / 50;
        tl.fromTo(
          el,
          { xPercent: 0, yPercent: 0, scale: 0.6, opacity: 0 },
          {
            x: () => dx * window.innerWidth * 0.9 * s,
            y: () => dy * window.innerHeight * 0.9 * s,
            scale: 1 + s * 1.6,
            opacity: 1,
            ease: "power1.in",
            duration: 0.7,
          },
          0.02 * s,
        );
        tl.to(el, { opacity: 0, duration: 0.1 }, 0.42 + 0.04 * s);
      });

      tl.fromTo(".c-text", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.2, stagger: 0.05, ease: "power3.out" }, 0.56);
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(".c-ave", { scale: 1 });
      gsap.set(".c-shout", { opacity: 0.5 });
      gsap.set(".c-text", { opacity: 1, y: 0 });
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={ref}
      data-year={colosseo.year}
      className="relative hidden md:block md:h-[300vh]"
      aria-label="Колизей"
    >
      <div className="c-pin relative h-[100dvh] overflow-hidden">
        <div
          data-menu-word="AVE"
          className="c-ave caps caps-outline absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none will-change-transform whitespace-nowrap"
          style={{ fontSize: "clamp(4.8rem, 28vw, 40rem)" }}
          aria-hidden
        >
          {colosseo.word.split("").map((ch, i) => (
            <span key={`${ch}-${i}`} className="inline-block overflow-visible align-bottom">
              <span className="inline-block">{ch}</span>
            </span>
          ))}
        </div>

        {colosseo.shouts.map((s, i) => (
          <span
            key={i}
            className="c-shout caps absolute text-ink-soft whitespace-nowrap will-change-transform text-[0.9rem] md:text-[1.25rem] tracking-[0.1em]"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
            data-s={s.s}
            data-x={s.x}
            data-y={s.y}
            aria-hidden
          >
            {s.text}
          </span>
        ))}

        <div className="absolute left-5 md:left-10 top-[18svh] md:top-1/2 md:-translate-y-1/2 max-w-[30rem] pr-8 z-10">
          <h2 className="c-text serif text-[1.7rem] md:text-[3.25rem] leading-[1.02]">{colosseo.title}</h2>
          <p className="c-text mt-6 text-ink-soft text-[0.95rem] md:text-base leading-relaxed max-w-[26rem]">
            {colosseo.body}
          </p>
        </div>

        <div className="c-text absolute right-0 bottom-[max(1rem,env(safe-area-inset-bottom))] w-[min(86vw,28rem)] md:right-[3vw] md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:w-[46vw]">
          <Sketch src="/sketch/sketch-colosseo.jpg" alt="Карандашный набросок Колизея" width={1152} height={864} />
        </div>
      </div>
    </section>
  );
}
