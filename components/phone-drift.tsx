"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, MOTION_OK, PHONE } from "@/lib/gsap";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  from?: number;
  to?: number;
  xFrom?: number;
  xTo?: number;
};

/** Параллакс только на телефоне. Десктопный DOM этот компонент не двигает. */
export function PhoneDrift({ children, className, style, from = 48, to = -48, xFrom = 0, xTo = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(`${MOTION_OK} and ${PHONE}`, () => {
      gsap.fromTo(
        el,
        { y: from, x: xFrom },
        {
          y: to,
          x: xTo,
          ease: "none",
          force3D: true,
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });
    return () => mm.revert();
  }, [from, to, xFrom, xTo]);

  return (
    <div ref={ref} className={className} style={{ ...style, willChange: "transform" }}>
      {children}
    </div>
  );
}
