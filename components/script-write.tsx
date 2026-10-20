"use client";

import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from "react";
import { gsap, MOTION_OK, DESK, PHONE } from "@/lib/gsap";

type Props = {
  text: string;
  className?: string;
  style?: CSSProperties;
  /** Индексы букв, которые красятся в помпейский красный (рубрикация). */
  accent?: number[];
  /** Доля экрана, на которой надпись дописывается: start -> end (ScrollTrigger positions) */
  start?: string;
  end?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "className" | "style">;

/** Каллиграфия, которая пишется, пока проезжает через экран. */
export function ScriptWrite({
  text,
  className = "",
  style,
  accent,
  start = "top 85%",
  end = "top 35%",
  ...rest
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const marks = accent?.length ? new Set(accent) : null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
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
  }, [start, end]);

  return (
    <span ref={ref} className={`script write inline-block ${className}`} style={style} {...rest}>
      {marks
        ? text.split("").map((ch, i) =>
            marks.has(i) ? (
              <span key={i} className="text-pompei">
                {ch}
              </span>
            ) : (
              <span key={i}>{ch}</span>
            ),
          )
        : text}
    </span>
  );
}
