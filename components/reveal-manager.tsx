"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger, REDUCED } from "@/lib/gsap";

/** Появление всех .reveal по мере скролла. Один наблюдатель на страницу. */
export function RevealManager() {
  useEffect(() => {
    if (window.matchMedia(REDUCED).matches) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.batch(".reveal", {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 1.1,
            stagger: 0.09,
            ease: "power3.out",
            overwrite: true,
          }),
      });
    });
    return () => ctx.revert();
  }, []);
  return null;
}
