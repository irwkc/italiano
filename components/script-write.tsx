"use client";

import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from "react";
import { gsap, MOTION_OK, DESK, PHONE } from "@/lib/gsap";

type Props = {
  text: string;
  className?: string;
  style?: CSSProperties;
  /** Индексы букв в помпейский красный. */
  accent?: number[];
  start?: string;
  end?: string;
  /** false — без CSS-mask (десктоп метода: маска резала выносные). */
  mask?: boolean;
} & Omit<HTMLAttributes<HTMLSpanElement>, "className" | "style">;

/** Каллиграфия; при mask пишется по скроллу. */
export function ScriptWrite({
  text,
  className = "",
  style,
  accent,
  start = "top 85%",
  end = "top 35%",
  mask = true,
  ...rest
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const marks = accent?.length ? new Set(accent) : null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();

    if (!mask) {
      gsap.set(el, { opacity: 1, clearProps: "transform" });
      mm.add(`${MOTION_OK} and ${DESK}`, () => {
        gsap.fromTo(
          el,
          { opacity: 0.15 },
          {
            opacity: 1,
            ease: "none",
            force3D: false,
            scrollTrigger: { trigger: el, start, end, scrub: 0.5 },
          },
        );
      });
      return () => mm.revert();
    }

    mm.add(PHONE, () => {
      gsap.set(el, { "--w": 0 });
    });
    mm.add(`${MOTION_OK} and ${DESK}`, () => {
      gsap.to(el, {
        "--w": 0,
        ease: "none",
        scrollTrigger: { trigger: el, start, end, scrub: 0.5 },
      });
    });
    return () => mm.revert();
  }, [start, end, mask]);

  return (
    <span
      ref={ref}
      className={`script inline-block overflow-visible ${mask ? "write" : ""} ${className}`}
      style={
        mask
          ? style
          : {
              lineHeight: 1.5,
              ...style,
            }
      }
      {...rest}
    >
      {marks
        ? text.split("").map((ch, i) => {
            const accent = marks.has(i);
            return (
              <span
                key={i}
                {...(accent ? { "data-menu-accent": "" } : {})}
                className={`inline-block align-baseline leading-none ${accent ? "text-pompei" : ""}`}
              >
                {ch}
              </span>
            );
          })
        : text}
    </span>
  );
}
