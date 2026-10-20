"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLenis } from "@/lib/lenis-store";
import { site } from "@/lib/content";
import { findMenuSource, type MenuSource } from "@/lib/menu-source";
import { ChapterMenu } from "@/components/chapter-menu";

export function Nav() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [source, setSource] = useState<MenuSource | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const travel = useRef(false);
  const openRef = useRef(false);
  const closingRef = useRef(false);
  openRef.current = open;
  closingRef.current = closing;

  const requestClose = useCallback(() => {
    if (!openRef.current || closingRef.current || travel.current) return;
    setClosing(true);
  }, []);

  const handleClosed = useCallback(() => {
    travel.current = false;
    setClosing(false);
    setOpen(false);
    setSource(null);
    getLenis()?.start();
  }, []);

  const openMenu = () => {
    setSource(findMenuSource());
    setClosing(false);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    wasOpen.current = true;
    getLenis()?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      getLenis()?.start();
    };
  }, [open, requestClose]);

  useEffect(() => {
    if (!open && wasOpen.current) buttonRef.current?.focus();
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[70] grid grid-cols-12 gap-4 px-5 pt-5 md:px-10 md:pt-7 pointer-events-none">
        <div className="col-span-6 md:col-span-3 pointer-events-auto">
          <a href="#top" className="label block text-ink">
            Giacomo
            <br />
            <span className="text-ink-soft">{site.origin}</span>
          </a>
        </div>
        <div className="hidden md:block md:col-span-6 text-center">
          <span className="script text-[1.75rem] leading-none text-pompei">G</span>
        </div>
        <div className="col-span-6 md:col-span-3 flex justify-end pointer-events-auto">
          <button
            ref={buttonRef}
            type="button"
            className="label text-ink cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97]"
            aria-expanded={open && !closing}
            aria-controls="site-menu"
            onClick={() => (open ? requestClose() : openMenu())}
          >
            {open && !closing ? "Chiudi" : "Menù"}
          </button>
        </div>
      </header>

      {open && source && (
        <ChapterMenu
          source={source}
          closing={closing}
          onClosed={handleClosed}
          onRequestClose={requestClose}
          onTravelStart={() => {
            travel.current = true;
          }}
          onTravelEnd={handleClosed}
        />
      )}
    </>
  );
}
