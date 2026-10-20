"use client";

import { useEffect, useRef } from "react";
import { gsap, MOTION_OK, PHONE, DESK } from "@/lib/gsap";
import { roma } from "@/lib/content";
import { PhoneDrift } from "@/components/phone-drift";

/** Хаотичная раскладка пар вокруг ROMA: сверху / по бокам / снизу. */
const phonePairs = [
  { ...roma.pairs[0], x: 5, y: 10, rot: -5, size: "1.9rem" },
  { ...roma.pairs[1], x: 58, y: 7, rot: 4, size: "2.05rem" },
  { ...roma.pairs[4], x: 34, y: 21, rot: -2, size: "1.7rem" },
  { ...roma.pairs[2], x: 3, y: 63, rot: 3, size: "1.95rem" },
  { ...roma.pairs[3], x: 54, y: 66, rot: -4, size: "2.1rem" },
];

const phoneGhosts = [
  { text: "urbs", x: 72, y: 18, size: "1.35rem", from: -18, to: 28 },
  { text: "lingua", x: 8, y: 38, size: "1.55rem", from: 22, to: -30 },
  { text: "vox", x: 68, y: 58, size: "1.7rem", from: -24, to: 36 },
  { text: "populus", x: 18, y: 78, size: "1.25rem", from: 16, to: -22 },
];

/** Глава I. Латынь превращается в итальянский, пока "ROMA" наполняется чернилами. */
export function Roma() {
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
    mm.add(`${MOTION_OK} and ${PHONE}`, () => {
      const pin = root.querySelector(".r-pin-m");
      if (!pin) return;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.querySelector(".r-phone"),
          start: "top top",
          end: "bottom bottom",
          scrub: 0.55,
          pin: pin,
          pinSpacing: false,
        },
      });
      tl.fromTo(
        ".r-fill-m",
        { clipPath: "inset(100% -0.12em -0.12em -0.12em)" },
        { clipPath: "inset(-0.12em -0.12em -0.12em -0.12em)", ease: "none", duration: 1 },
        0,
      );
      root.querySelectorAll<HTMLElement>(".r-pair-m").forEach((pair, i) => {
        const at = 0.06 + i * 0.18;
        tl.to(pair.querySelector(".r-la"), { opacity: 0.2, y: -10, duration: 0.12, ease: "power2.in" }, at);
        tl.to(pair.querySelector(".r-it"), { "--w": 0, duration: 0.18, ease: "power2.inOut" }, at + 0.02);
      });
      tl.fromTo(".r-copy-m", { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.22, ease: "power3.out" }, 0.72);
    });
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(".r-fill, .r-fill-m", { clipPath: "inset(-0.12em -0.12em -0.12em -0.12em)" });
      gsap.set(".r-la", { opacity: 0.35 });
      gsap.set(".r-it", { "--w": 0 });
      gsap.set(".r-copy-m", { opacity: 1, y: 0 });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={ref} id="storia" data-year={roma.year} className="relative md:h-[320vh]" aria-label="Рим">
      <div className="r-phone md:hidden relative h-[160vh]">
        <div className="r-pin-m relative h-[100dvh] overflow-hidden pb-[max(5.5rem,env(safe-area-inset-bottom))]">
          {phoneGhosts.map((g) => (
            <PhoneDrift
              key={g.text}
              from={g.from}
              to={g.to}
              xFrom={g.from * 0.35}
              xTo={g.to * 0.3}
              className="absolute z-0 pointer-events-none"
              style={{ left: `${g.x}%`, top: `${g.y}%` }}
            >
              <span
                className="script select-none text-ink/[0.14]"
                style={{ fontSize: g.size }}
                aria-hidden
              >
                {g.text}
              </span>
            </PhoneDrift>
          ))}

          {phonePairs.map((p) => (
            <div
              key={p.la}
              className="r-pair-m absolute z-10"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: `rotate(${p.rot}deg)`,
              }}
            >
              <span className="r-la caps block text-[0.72rem] tracking-[0.12em] text-ink-soft">{p.la}</span>
              <span
                className="r-it script write block text-pompei -mt-[0.2em]"
                style={{ fontSize: p.size }}
              >
                {p.it}
              </span>
            </div>
          ))}

          <div
            data-menu-word="ROMA"
            data-menu-solid
            className="caps absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap"
            style={{ fontSize: "clamp(4.6rem, 34vw, 8rem)" }}
            aria-hidden
          >
            <span className="caps-outline block">{roma.word}</span>
            <span
              className="r-fill-m absolute inset-0 block"
              style={{ clipPath: "inset(100% -0.12em -0.12em -0.12em)" }}
            >
              {roma.word}
            </span>
          </div>

          <div className="r-copy-m absolute left-5 right-5 bottom-[max(5.5rem,calc(6svh+env(safe-area-inset-bottom)))] z-20">
            <h2 className="serif text-[1.55rem] leading-[1.08] max-w-[18rem]">{roma.title}</h2>
            <p className="mt-3 text-[0.9rem] text-ink-soft leading-relaxed max-w-[26rem]">{roma.body}</p>
          </div>
        </div>
      </div>

      <div className="r-pin relative hidden md:block h-[100dvh] overflow-hidden">
        <div
          data-menu-word="ROMA"
          className="caps absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap"
          style={{ fontSize: "clamp(4.2rem, 26vw, 36rem)" }}
          aria-hidden
        >
          <span className="caps-outline block">{roma.word}</span>
          <span className="r-fill absolute inset-0 block" style={{ clipPath: "inset(100% -0.12em -0.12em -0.12em)" }}>
            {roma.word}
          </span>
        </div>

        {roma.pairs.map((p) => (
          <div key={p.la} className="r-pair absolute" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <span className="r-la caps block text-[1.1rem] md:text-[1.6rem] tracking-[0.08em] text-ink-soft">
              {p.la}
            </span>
            <span className="r-it script write absolute left-0 -top-[0.35em] text-pompei text-[1.85rem] md:text-[4.5rem]">
              {p.it}
            </span>
          </div>
        ))}

        <div className="absolute right-5 md:right-10 bottom-[12vh] md:bottom-[14vh] max-w-[26rem] text-right">
          <h2 className="reveal serif text-[1.6rem] md:text-[2.25rem]">{roma.title}</h2>
          <p className="reveal mt-4 text-[0.95rem] md:text-base text-ink-soft leading-relaxed">{roma.body}</p>
        </div>
      </div>
    </section>
  );
}
