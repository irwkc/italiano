"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, REDUCED } from "@/lib/gsap";
import { setLenis } from "@/lib/lenis-store";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia(REDUCED).matches) return;

    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    setLenis(lenis);

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
