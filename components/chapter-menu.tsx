"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { gsap, REDUCED } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis-store";
import { site } from "@/lib/content";
import {
  clampMenuNav,
  cloneFit,
  gatherInkPad,
  measureGatherSlots,
  menuCloneSize,
  menuFitSize,
  menuStackHeight,
  type MenuGatherLetter,
  type MenuSource,
} from "@/lib/menu-source";

type Props = {
  source: MenuSource;
  closing: boolean;
  onClosed: () => void;
  onRequestClose: () => void;
  onTravelStart: () => void;
  onTravelEnd: () => void;
};

/**
 * Калибровка стека ITA/LI/ANO в клоне меню (не line-height).
 * Hero тянет строки отрицательным margin (−0.06em / −0.07em).
 * STACK_MARGIN_PULL — доля этого pull:
 *   1    = как в DOM hero (плотнее)
 *   0.55 = свободнее (дефолт)
 *   0    = без отрицательного margin (максимальный зазор)
 * STACK_LEADING — высота бокса буквы; на зазор между строками почти не влияет.
 */
const STACK_MARGIN_PULL = 1;
const STACK_LEADING = 0.82;

/** Контур + та же чернильная заливка, что у слова главы (ROMA на середине скролла). */
function InkCaps({ text, fillClip }: { text: string; fillClip?: string }) {
  return (
    <span className="relative inline-block">
      <span className="caps-outline block">{text}</span>
      {fillClip ? (
        <span className="r-fill absolute inset-0 block" style={{ clipPath: fillClip }} aria-hidden>
          {text}
        </span>
      ) : null}
    </span>
  );
}

/** Сдвиг клона из дома в italia. left/top клона всегда дом; летит transform. */
function gatherFlight(homes: MenuGatherLetter[], top: number, vw: number) {
  const dest = measureGatherSlots(homes, top, vw);
  return {
    x: (i: number) => (dest[i]?.left ?? 0) - (homes[i]?.left ?? 0),
    y: (i: number) => (dest[i]?.top ?? 0) - (homes[i]?.top ?? 0),
  };
}

export function ChapterMenu({ source, closing, onClosed, onRequestClose, onTravelStart, onTravelEnd }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLDivElement>(null);
  const gatherRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const traveling = useRef(false);
  const longest = site.nav.reduce((n, item) => Math.max(n, item.label.length), 0);
  const fit = menuFitSize(source, longest);
  const phone = typeof window !== "undefined" && window.innerWidth < 768;
  const stacked = Boolean(source.lines?.length);
  const gathering = Boolean(source.gather?.length);
  const solid =
    !gathering &&
    !stacked &&
    (source.solid || source.script || (phone && /[0-9]/.test(source.text)));
  const cloneSize = menuCloneSize(source);
  const scriptPad = source.script && !gathering ? gatherInkPad(cloneSize) : 0;
  const letters = source.text ? [...source.text.replace(/\s/g, "")] : [];
  const inkOutline = Boolean(source.outline && !source.script);
  // Сбор italia — script только у клонов букв; пункты меню остаются caps.
  const typeClass = source.script && !gathering ? "script" : "caps";

  useLayoutEffect(() => {
    document.documentElement.classList.add("menu-open");
    if (gathering) document.documentElement.classList.add("menu-gather");
    return () => {
      document.documentElement.classList.remove("menu-open");
      document.documentElement.classList.remove("menu-travel");
      document.documentElement.classList.remove("menu-gather");
    };
  }, [gathering]);

  useLayoutEffect(() => {
    const letterNodes = lettersRef.current?.querySelectorAll<HTMLElement>("[data-letter]");
    const gatherNodes = gatherRef.current?.querySelectorAll<HTMLElement>("[data-gather-letter]");
    const items = navRef.current?.querySelectorAll<HTMLElement>("[data-item]");
    const gloss = navRef.current?.querySelectorAll<HTMLElement>("[data-gloss]");
    if (!items?.length) return;
    if (!closing && navRef.current) clampMenuNav(navRef.current);

    const reduced = window.matchMedia(REDUCED).matches;
    const homes = source.gather;

    if (reduced) {
      gsap.set(letterNodes ?? [], { opacity: 0 });
      gsap.set(gatherNodes ?? [], { opacity: 0 });
      gsap.set(items, { yPercent: 0, opacity: 1 });
      gsap.set(gloss ?? [], { opacity: 1 });
      if (veilRef.current) gsap.set(veilRef.current, { opacity: closing ? 0 : 0.88 });
      firstLinkRef.current?.focus({ preventScroll: true });
      if (closing && !traveling.current) onClosed();
      return;
    }

    if (closing) {
      if (traveling.current) return;
      const clone = lettersRef.current;
      const veil = veilRef.current;
      const tl = gsap.timeline({
        onComplete: () => {
          document.documentElement.classList.remove("menu-undim");
          document.documentElement.classList.remove("menu-open");
          onClosed();
        },
      });
      tl.to(gloss ?? [], { opacity: 0, duration: 0.22, ease: "power2.inOut" }, 0);
      tl.to(items, { yPercent: 115, opacity: 0, duration: 0.48, stagger: 0.05, ease: "power2.inOut" }, 0);
      let snap: gsap.core.Tween | undefined;

      if (gathering && gatherNodes?.length && homes?.length) {
        const flight = gatherFlight(homes, source.top, window.innerWidth);
        gsap.set(gatherNodes, {
          x: (i) => flight.x(i),
          y: (i) => flight.y(i),
          visibility: "visible",
          opacity: 0,
          force3D: true,
        });
        tl.to(gatherNodes, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0.1);
        snap = gsap.to(gatherNodes, {
          x: 0,
          y: 0,
          duration: 0.9,
          stagger: 0.05,
          ease: "power2.inOut",
          autoRound: false,
          force3D: true,
        });
        tl.add(snap, 0.2);
        tl.add(() => document.documentElement.classList.add("menu-undim"), 0.28);
      } else if (letterNodes?.length) {
        if (solid) {
          tl.to(letterNodes, { y: 0, opacity: 1, duration: 0.9, ease: "power2.inOut" }, 0.12);
        } else {
          tl.to(
            letterNodes,
            {
              x: 0,
              y: 0,
              scale: 1,
              rotation: 0,
              opacity: 1,
              color: source.color,
              duration: 0.85,
              stagger: { each: 0.04, from: "end" },
              ease: "power2.inOut",
            },
            0.12,
          );
        }
      }
      if (!gathering && clone && source.el) {
        tl.add(() => {
          if (stacked) {
            const to = source.el!.getBoundingClientRect();
            snap = gsap.to(clone, {
              left: to.left,
              top: to.top,
              scaleX: 1,
              scaleY: 1,
              x: 0,
              y: 0,
              duration: 0.22,
              ease: "power2.inOut",
            });
          } else {
            const sx = Number(gsap.getProperty(clone, "scaleX")) || 1;
            const sy = Number(gsap.getProperty(clone, "scaleY")) || 1;
            snap = gsap.to(clone, {
              transformOrigin: "0 0",
              ...cloneFit(clone.getBoundingClientRect(), source.el!, sx, sy),
              duration: 0.22,
              ease: "power2.inOut",
            });
          }
        });
        tl.to({}, { duration: 0.24 });
      }
      if (!gathering) tl.add(() => document.documentElement.classList.add("menu-undim"));
      if (veil) {
        tl.to(
          veil,
          { opacity: 0, duration: gathering ? 0.8 : 0.45, ease: "power2.inOut" },
          gathering ? 0.28 : "<",
        );
      }
      tl.add(() => {
        document.documentElement.classList.remove("menu-open");
        document.documentElement.classList.remove("menu-gather");
        if (clone) gsap.set(clone, { autoAlpha: 0 });
        if (gatherNodes?.length) gsap.set(gatherNodes, { autoAlpha: 0 });
      });
      return () => {
        snap?.kill();
        tl.kill();
      };
    }

    gsap.set(items, { yPercent: 115, opacity: 0 });
    gsap.set(gloss ?? [], { opacity: 0 });
    const clone = lettersRef.current;
    if (clone && !gathering) {
      gsap.set(clone, { scaleX: 1, scaleY: 1, x: 0, y: 0, xPercent: 0, yPercent: 0, autoAlpha: 1 });
      if (source.el) {
        if (stacked) {
          const to = source.el.getBoundingClientRect();
          gsap.set(clone, { left: to.left, top: to.top, transformOrigin: "0 0" });
        } else {
          void clone.offsetWidth;
          gsap.set(clone, cloneFit(clone.getBoundingClientRect(), source.el, 1, 1));
        }
      }
    }
    if (letterNodes?.length && !gathering) {
      gsap.set(letterNodes, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });
    }

    const tl = gsap.timeline();
    if (veilRef.current) tl.to(veilRef.current, { opacity: 0.88, duration: 0.45, ease: "power2.inOut" }, 0);

    if (gathering && gatherNodes?.length && homes?.length) {
      const flight = gatherFlight(homes, source.top, window.innerWidth);
      gsap.set(gatherNodes, {
        x: 0,
        y: 0,
        opacity: 1,
        autoAlpha: 1,
        force3D: true,
      });
      tl.to(
        gatherNodes,
        {
          x: (i) => flight.x(i),
          y: (i) => flight.y(i),
          duration: 0.95,
          stagger: 0.06,
          ease: "power2.inOut",
          autoRound: false,
          force3D: true,
        },
        0.08,
      );
      tl.to(gatherNodes, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, 1.5);
    } else if (letterNodes?.length) {
      if (solid) {
        tl.to(letterNodes, { y: -36, opacity: 0, duration: 0.9, ease: "power2.inOut" }, 0);
      } else {
        const n = letterNodes.length;
        tl.to(
          letterNodes,
          {
            x: (i) => (i - (n - 1) / 2) * 18,
            y: (i) => (i % 2 === 0 ? -56 : 64),
            rotation: (i) => (i - (n - 1) / 2) * 5,
            opacity: 0,
            duration: 0.85,
            stagger: 0.04,
            ease: "power2.inOut",
          },
          0,
        );
      }
    }
    const namesAt = gathering ? 2.1 : letterNodes?.length ? 0.55 : 0.12;
    tl.to(
      items,
      { yPercent: 0, opacity: 1, duration: 1.05, stagger: 0.14, ease: "power2.out" },
      namesAt,
    );
    tl.to(gloss ?? [], { opacity: 1, duration: 0.5, stagger: 0.14, ease: "power2.out" }, namesAt + 0.45);
    tl.add(() => firstLinkRef.current?.focus({ preventScroll: true }), namesAt + 0.7);

    return () => {
      tl.kill();
    };
  }, [closing, onClosed, source.el, source.script, source.solid, source.color, source.top, source.gather, stacked, solid, gathering]);

  const go = (href: string) => {
    if (traveling.current || closing) return;
    const items = navRef.current?.querySelectorAll<HTMLElement>("[data-item]");
    const gloss = navRef.current?.querySelectorAll<HTMLElement>("[data-gloss]");
    traveling.current = true;
    onTravelStart();

    const reduced = window.matchMedia(REDUCED).matches;
    const finish = () => {
      document.documentElement.classList.remove("menu-open");
      document.documentElement.classList.remove("menu-undim");
      onTravelEnd();
    };

    const scrollTo = () => {
      getLenis()?.start();
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(href, { duration: reduced ? 0 : 1.2 });
      else document.querySelector(href)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    };

    if (reduced) {
      scrollTo();
      finish();
      return;
    }

    const clone = lettersRef.current;
    const gatherNodes = gatherRef.current?.querySelectorAll<HTMLElement>("[data-gather-letter]");
    const veil = veilRef.current;
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(gloss ?? [], { opacity: 0, duration: 0.22, ease: "power2.inOut" }, 0);
    if (items?.length) {
      tl.to(items, { yPercent: 115, opacity: 0, duration: 0.48, stagger: 0.05, ease: "power2.inOut" }, 0);
    }
    if (clone) tl.to(clone, { autoAlpha: 0, duration: 0.35, ease: "power2.inOut" }, 0);
    if (gatherNodes?.length) tl.to(gatherNodes, { autoAlpha: 0, duration: 0.35, ease: "power2.inOut" }, 0);
    tl.add(() => {
      document.documentElement.classList.add("menu-undim");
      document.documentElement.classList.remove("menu-open");
      scrollTo();
    });
    if (veil) tl.to(veil, { opacity: 0, duration: 0.45, ease: "power2.inOut" }, "<");
  };

  const stackH = menuStackHeight(fit, source.script);
  const vh = typeof window !== "undefined" ? (window.visualViewport?.height ?? window.innerHeight) : 800;
  const topMin = typeof window !== "undefined" && window.innerWidth < 768 ? 72 : 88;
  const topMax = Math.max(topMin, vh - stackH - 28);
  const stackTop = Math.max(
    topMin,
    Math.min(source.top + source.height / 2 - stackH / 2, topMax),
  );

  const navW = Math.min(window.innerWidth * 0.92, 72 * 16);
  const alignStyle: CSSProperties = phone
    ? { left: 20, textAlign: "left" }
    : source.align === "center"
      ? { left: 0, right: 0, marginInline: "auto", textAlign: "center" }
      : source.align === "right"
        ? {
            right: Math.max(20, window.innerWidth - source.left - source.width),
            textAlign: "right",
          }
        : {
            left: Math.max(20, Math.min(source.left, window.innerWidth - navW - 20)),
            textAlign: "left",
          };

  // Script без write: line-height как у источника (1.5), иначе глифы режет 0.9.
  const cloneLineHeight = stacked
    ? STACK_LEADING
    : source.script
      ? source.lineHeight || "1.5"
      : source.lineHeight || 0.82;

  return (
    <div
      ref={rootRef}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Меню"
      className="fixed inset-0 z-[55]"
    >
      <div ref={veilRef} className="menu-veil" aria-hidden />
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Закрыть меню"
        onClick={onRequestClose}
      />
      {/* Метод: клоны красных букв слетаются в italia */}
      {gathering && source.gather && (
        <div ref={gatherRef} className="pointer-events-none fixed inset-0 z-[58] overflow-visible" aria-hidden>
          {source.gather.map((g, i) => {
            const pad = gatherInkPad(g.fontSize);
            return (
              <span
                key={`g-${g.char}-${i}`}
                data-gather-letter
                className="script absolute inline-block select-none overflow-visible"
                style={{
                  left: g.left - pad,
                  top: g.top - pad,
                  padding: pad,
                  boxSizing: "content-box",
                  fontSize: g.fontSize,
                  fontFamily: g.fontFamily,
                  lineHeight: 1,
                  color: g.color,
                }}
              >
                {g.char}
              </span>
            );
          })}
        </div>
      )}
      {!gathering && (letters.length > 0 || stacked) && (
        <div
          ref={lettersRef}
          className={`pointer-events-none fixed select-none overflow-visible ${typeClass} ${inkOutline && !source.fillClip ? "caps-outline" : ""} ${stacked ? "" : "whitespace-nowrap"}`}
          style={{
            left: source.left,
            top: source.top,
            fontSize: stacked ? source.lines![0].fontSize : cloneSize,
            fontFamily: source.fontFamily,
            fontWeight: source.fontWeight,
            letterSpacing: source.letterSpacing,
            color: source.color,
            lineHeight: cloneLineHeight,
            paddingLeft: stacked ? source.paddingLeft : undefined,
            width: stacked ? source.width : undefined,
            boxSizing: "border-box",
          }}
          aria-hidden
        >
          {stacked ? (
            source.lines!.map((line, i) => (
              <span
                key={`${line.text}-${i}`}
                className="block overflow-hidden"
                style={{
                  fontSize: line.fontSize,
                  letterSpacing: line.letterSpacing,
                  lineHeight: STACK_LEADING,
                  marginTop:
                    i === 0 || !line.marginTopEm
                      ? undefined
                      : `${line.marginTopEm * STACK_MARGIN_PULL}em`,
                }}
              >
                {[...line.text].map((ch, j) => (
                  <span key={`${ch}-${j}`} className="inline-block overflow-hidden align-bottom">
                    <span data-letter className="inline-block will-change-transform">
                      {ch}
                    </span>
                  </span>
                ))}
              </span>
            ))
          ) : solid ? (
            <span
              data-letter
              className="block overflow-visible will-change-transform"
              style={
                scriptPad
                  ? { padding: scriptPad, margin: -scriptPad, boxSizing: "content-box" }
                  : undefined
              }
            >
              {source.fillClip ? <InkCaps text={source.text} fillClip={source.fillClip} /> : source.text}
            </span>
          ) : (
            letters.map((ch, i) => (
              <span key={`${ch}-${i}`} className="inline-block overflow-visible align-bottom p-[0.15em] -m-[0.15em]">
                <span data-letter className="inline-block overflow-visible will-change-transform">
                  {ch === " " ? (
                    "\u00a0"
                  ) : inkOutline ? (
                    <InkCaps text={ch} fillClip={source.fillClip} />
                  ) : (
                    ch
                  )}
                </span>
              </span>
            ))
          )}
        </div>
      )}
      <nav
        ref={navRef}
        className="pointer-events-none fixed z-[56] w-[min(92vw,72rem)]"
        style={{ top: stackTop, fontSize: fit, ...alignStyle }}
      >
        <ul>
          {site.nav.map((n, i) => (
            <li key={n.href} className={solid ? "overflow-hidden py-[0.3em] -my-[0.3em]" : "overflow-hidden"}>
              <a
                ref={i === 0 ? firstLinkRef : undefined}
                href={n.href}
                data-item
                data-href={n.href}
                className="menu-item pointer-events-auto group block no-underline outline-none cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  go(n.href);
                }}
              >
                <span
                  className={`${typeClass} relative block leading-[0.82] transition-colors duration-200 group-hover:text-pompei group-focus-visible:text-pompei`}
                  style={source.script || inkOutline ? undefined : { color: source.color }}
                >
                  {inkOutline ? <InkCaps text={n.label} fillClip={source.fillClip} /> : n.label}
                </span>
                <span data-gloss className="label block mt-[0.12em] mb-[0.38em] normal-case tracking-[0.04em]">
                  {n.ru}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
