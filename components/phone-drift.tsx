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

/** Параллакс только на телефоне. Двигаем внутренний слой, триггер — неподвижная обёртка. */
export function PhoneDrift({ children, className, style, from = 48, to = -48, xFrom = 0, xTo = 0 }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = wrap.current;
    const el = layer.current;
    if (!trigger || !el) return;
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
          autoRound: false,
          scrollTrigger: {
            trigger,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    });
    return () => mm.revert();
  }, [from, to, xFrom, xTo]);

  return (
    <div ref={wrap} className={className} style={style}>
      <div ref={layer}>{children}</div>
    </div>
  );
}
