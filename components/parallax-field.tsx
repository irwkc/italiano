"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, REDUCED } from "@/lib/gsap";

type Props = {
  children: ReactNode;
  className?: string;
  /** Насколько далеко едут элементы при speed = 0 или 2 (px) */
  range?: number;
  id?: string;
  "data-year"?: string;
};

/**
 * Контролируемый хаос: потомки с data-speed едут с разной скоростью при скролле.
 * speed 1 = неподвижно относительно страницы, < 1 отстаёт, > 1 опережает.
 */
export function ParallaxField({ children, className, range = 220, ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia(REDUCED).matches) return;
    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => {
        const speed = parseFloat(el.dataset.speed ?? "1");
        gsap.fromTo(
          el,
          { y: (speed - 1) * range },
          {
            y: (1 - speed) * range,
            ease: "none",
            scrollTrigger: { trigger: root, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    }, root);
    return () => ctx.revert();
  }, [range]);

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
}
