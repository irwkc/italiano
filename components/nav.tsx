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

  const requestClose = useCallback(() => {
    if (travel.current) return;
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
      <header className="fixed inset-x-0 top-0 z-[70] grid grid-cols-12 gap-4 px-5 pt-[calc(env(safe-area-inset-top)+0.35rem)] md:px-10 md:pt-[max(1.75rem,env(safe-area-inset-top))] pointer-events-none">
        <div className="col-span-5 md:col-span-3 pointer-events-auto">
          <a href="#top" className="label flex min-h-11 items-center text-ink">
            <span>
              Giacomo
              <br />
              <span className="text-ink-soft">{site.origin}</span>
            </span>
          </a>
        </div>
        <div className="col-span-2 md:col-span-6 flex items-center justify-center">
          <span className="script text-[1.55rem] md:text-[1.75rem] leading-none text-pompei" aria-hidden>
            G
          </span>
        </div>
        <div className="col-span-5 md:col-span-3 flex justify-end pointer-events-auto">
          <button
            ref={buttonRef}
            type="button"
            className="label min-h-11 min-w-11 text-ink cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97]"
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
