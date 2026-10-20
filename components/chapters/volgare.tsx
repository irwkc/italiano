"use client";

import { useEffect, useRef } from "react";
import { gsap, MOTION_OK, DESK, PHONE } from "@/lib/gsap";
import { volgare } from "@/lib/content";
import { Sketch } from "@/components/sketch";
import { PhoneDrift } from "@/components/phone-drift";

function CapsLetters({ word }: { word: string }) {
  return word.split("").map((ch, i) => (
    <span key={`${ch}-${i}`} className="inline-block overflow-visible align-bottom">
      <span className="inline-block">{ch}</span>
    </span>
  ));
}

/** Глава III. Десктоп: полный пан. Мобилка: с intro Данте, без гигантского 1321. */
export function Volgare() {
  const wrap = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = wrap.current;
    const t = track.current;
    if (!w || !t) return;
    const mm = gsap.matchMedia();
    mm.add(`${MOTION_OK} and ${DESK}`, () => {
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
    mm.add(`${MOTION_OK} and ${PHONE}`, () => {
      gsap.to(".v-verse", {
        "--w": 0,
        ease: "none",
        scrollTrigger: { trigger: ".v-verse", start: "top 90%", end: "top 48%", scrub: 0.4 },
      });
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(t, { x: 0, flexWrap: "wrap" });
      gsap.set(".v-verse", { "--w": 0 });
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      ref={wrap}
      data-year={volgare.year}
      className="relative overflow-hidden"
      aria-label="Данте"
    >
      <div className="md:hidden px-5 pt-14 pb-16">
        <div>
          <h2 className="serif text-[1.55rem] leading-[1.08]">{volgare.intro.title}</h2>
          <p className="mt-3 text-ink-soft text-[0.9rem] leading-relaxed">{volgare.intro.body}</p>
        </div>

        <p
          className="v-verse script write text-pompei my-12"
          style={{ fontSize: "clamp(2.35rem, 11vw, 3.4rem)", lineHeight: 0.94, display: "block" }}
        >
          Nel mezzo del
          <br />
          cammin di nostra
          <br />
          vita
        </p>

        <div className="relative overflow-hidden">
          <PhoneDrift from={-10} to={24} xFrom={14} xTo={-18} className="absolute -left-[8vw] top-0 z-0">
            <span
              data-menu-word="VOLGARE"
              className="caps text-ink select-none whitespace-nowrap"
              style={{ fontSize: "clamp(4rem, 28vw, 7rem)" }}
              aria-hidden
            >
              <CapsLetters word={volgare.outro.word} />
            </span>
          </PhoneDrift>
          <PhoneDrift from={28} to={-36} className="relative z-10 w-[72vw] mt-8">
            <Sketch
              src="/sketch/sketch-dante.jpg"
              alt="Карандашный профиль Данте"
              width={864}
              height={1152}
              sizes="72vw"
            />
          </PhoneDrift>
          <div className="relative z-10 mt-8">
            <h2 className="serif text-[1.55rem] leading-[1.08]">{volgare.outro.title}</h2>
            <p className="mt-3 text-ink-soft text-[0.9rem] leading-relaxed">{volgare.outro.body}</p>
          </div>
        </div>
      </div>

      <div ref={track} className="hidden md:flex h-[100dvh] items-stretch w-max">
        <div className="relative w-screen shrink-0">
          <span
            data-menu-word="1321"
            className="v-year caps absolute -left-[2vw] top-[10vh] text-ink select-none"
            style={{ fontSize: "clamp(4.5rem, 28vw, 38rem)" }}
            aria-hidden
          >
            <CapsLetters word="1321" />
          </span>
          <div className="absolute right-5 md:right-10 bottom-[14vh] max-w-[28rem] text-right">
            <h2 className="reveal serif text-[1.75rem] md:text-[2.5rem]">{volgare.intro.title}</h2>
            <p className="reveal mt-4 text-ink-soft text-[0.95rem] md:text-base leading-relaxed">{volgare.intro.body}</p>
          </div>
        </div>

        <div className="relative flex items-center shrink-0 px-[8vw]">
          <p
            className="v-line script write whitespace-nowrap text-pompei select-none"
            style={{ fontSize: "clamp(2.6rem, 10vw, 16rem)" }}
          >
            {volgare.line}
          </p>
        </div>

        <div className="relative w-screen shrink-0">
          <span
            data-menu-word="VOLGARE"
            className="caps absolute right-[-6vw] top-[8vh] text-ink select-none whitespace-nowrap"
            style={{ fontSize: "clamp(6rem, 24vw, 30rem)" }}
            aria-hidden
          >
            <CapsLetters word={volgare.outro.word} />
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
          <span className="label absolute hidden md:block left-[36%] top-[52%] max-w-[12ch]">Commedia, Firenze</span>
          <div className="absolute left-5 md:left-[12%] bottom-[14vh] max-w-[26rem]">
            <h2 className="serif text-[1.75rem] md:text-[2.5rem]">{volgare.outro.title}</h2>
            <p className="mt-4 text-ink-soft text-[0.95rem] md:text-base leading-relaxed">{volgare.outro.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
