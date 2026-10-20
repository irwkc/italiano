"use client";

import { useEffect, useRef } from "react";
import { gsap, MOTION_OK } from "@/lib/gsap";
import { volgare } from "@/lib/content";
import { Sketch } from "@/components/sketch";

/** Глава III. Горизонтальный пан: 1321, строка Данте пишется поперёк экрана, рождается volgare. */
export function Volgare() {
  const wrap = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = wrap.current;
    const t = track.current;
    if (!w || !t) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const distance = () => t.scrollWidth - window.innerWidth;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: w,
          start: "top top",
          end: () => `+=${distance() * 1.15}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      tl.to(t, { x: () => -distance(), ease: "none", duration: 1 }, 0);
      tl.to(".v-line", { "--w": 0, ease: "none", duration: 0.55 }, 0.2);
      tl.fromTo(".v-year", { xPercent: 0 }, { xPercent: 25, ease: "none", duration: 0.5 }, 0);
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(t, { x: 0, flexWrap: "wrap" });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={wrap} data-year={volgare.year} className="relative overflow-hidden" aria-label="Данте">
      <div ref={track} className="flex h-[100dvh] items-stretch w-max">
        {/* Панель 1 */}
        <div className="relative w-screen shrink-0">
          <span
            className="v-year caps absolute -left-[2vw] top-[10vh] text-ink select-none"
            style={{ fontSize: "clamp(7rem, 32vw, 38rem)" }}
            aria-hidden
          >
            1321
          </span>
          <div className="absolute right-5 md:right-10 bottom-[14vh] max-w-[28rem] text-right">
            <h2 className="reveal serif text-[1.75rem] md:text-[2.5rem]">{volgare.intro.title}</h2>
            <p className="reveal mt-4 text-ink-soft text-[0.95rem] md:text-base leading-relaxed">{volgare.intro.body}</p>
          </div>
        </div>

        {/* Панель 2: строка Данте */}
        <div className="relative flex items-center shrink-0 px-[8vw]">
          <p
            className="v-line script write whitespace-nowrap text-pompei select-none"
            style={{ fontSize: "clamp(4rem, 12vw, 16rem)" }}
          >
            {volgare.line}
          </p>
        </div>

        {/* Панель 3 */}
        <div className="relative w-screen shrink-0">
          <span
            className="caps absolute right-[-6vw] top-[8vh] text-ink select-none whitespace-nowrap"
            style={{ fontSize: "clamp(6rem, 24vw, 30rem)" }}
            aria-hidden
          >
            {volgare.outro.word}
          </span>
          <div className="absolute left-[10%] top-[12vh] w-[40vw] md:left-[14%] md:top-[8vh] md:w-[20vw]">
            <Sketch
              src="/sketch/sketch-dante.jpg"
              alt="Карандашный профиль Данте"
              width={864}
              height={1152}
              sizes="(min-width: 768px) 20vw, 40vw"
            />
          </div>
          <span className="label absolute left-[36%] top-[52%] max-w-[12ch]">Commedia, Firenze</span>
          <div className="absolute left-5 md:left-[12%] bottom-[14vh] max-w-[26rem]">
            <h2 className="serif text-[1.75rem] md:text-[2.5rem]">{volgare.outro.title}</h2>
            <p className="mt-4 text-ink-soft text-[0.95rem] md:text-base leading-relaxed">{volgare.outro.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
