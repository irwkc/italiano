"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { gsap, MOTION_OK } from "@/lib/gsap";

type Props = {
  text: string;
  className?: string;
  style?: CSSProperties;
  /** Доля экрана, на которой надпись дописывается: start -> end (ScrollTrigger positions) */
  start?: string;
  end?: string;
};

/** Каллиграфия, которая пишется, пока проезжает через экран. */
export function ScriptWrite({ text, className = "", style, start = "top 85%", end = "top 35%" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.to(el, {
        "--w": 0,
        ease: "none",
        scrollTrigger: { trigger: el, start, end, scrub: 0.5 },
      });
    });
    return () => mm.revert();
  }, [start, end]);

  return (
    <span ref={ref} className={`script write inline-block ${className}`} style={style}>
      {text}
    </span>
  );
}
