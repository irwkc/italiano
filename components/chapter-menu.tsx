"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { gsap, REDUCED } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis-store";
import { site } from "@/lib/content";
import { cloneFit, findMenuDest, inkBox, menuFitSize, type MenuSource } from "@/lib/menu-source";

type Props = {
  source: MenuSource;
  closing: boolean;
  onClosed: () => void;
  onRequestClose: () => void;
  onTravelStart: () => void;
  onTravelEnd: () => void;
};

export function ChapterMenu({ source, closing, onClosed, onRequestClose, onTravelStart, onTravelEnd }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const traveling = useRef(false);
  const longest = site.nav.reduce((n, item) => Math.max(n, item.label.length), 0);
  const fit = menuFitSize(source, longest);
  const letters = source.text ? [...source.text] : [];

  useLayoutEffect(() => {
    document.documentElement.classList.add("menu-open");
    return () => {
      document.documentElement.classList.remove("menu-open");
      document.documentElement.classList.remove("menu-travel");
    };
  }, []);

  useLayoutEffect(() => {
    const letterNodes = lettersRef.current?.querySelectorAll<HTMLElement>("[data-letter]");
    const items = navRef.current?.querySelectorAll<HTMLElement>("[data-item]");
    const gloss = navRef.current?.querySelectorAll<HTMLElement>("[data-gloss]");
    if (!items?.length) return;

    const reduced = window.matchMedia(REDUCED).matches;

    if (reduced) {
      gsap.set(letterNodes ?? [], { opacity: 0 });
      gsap.set(items, { yPercent: 0, opacity: 1 });
      gsap.set(gloss ?? [], { opacity: 1 });
      firstLinkRef.current?.focus({ preventScroll: true });
      if (closing && !traveling.current) onClosed();
      return;
    }

    if (closing) {
      if (traveling.current) return;
      document.documentElement.classList.add("menu-undim");
      const clone = lettersRef.current;
      const tl = gsap.timeline({
        onComplete: () => {
          document.documentElement.classList.remove("menu-undim");
          onClosed();
        },
      });
      tl.to(gloss ?? [], { opacity: 0, duration: 0.22, ease: "power2.inOut" }, 0);
      tl.to(items, { yPercent: 115, opacity: 0, duration: 0.48, stagger: 0.05, ease: "power2.inOut" }, 0);
      if (letterNodes?.length) {
        if (source.script) {
          tl.to(letterNodes, { y: 0, opacity: 1, duration: 0.9, ease: "power2.inOut" }, 0.12);
        } else {
          tl.to(
            letterNodes,
            {
              x: 0,
              y: 0,
              rotation: 0,
              opacity: 1,
              duration: 0.85,
              stagger: { each: 0.04, from: "end" },
              ease: "power2.inOut",
            },
            0.12,
          );
        }
      }
      let snap: gsap.core.Tween | undefined;
      if (clone && source.el) {
        tl.add(() => {
          const sx = Number(gsap.getProperty(clone, "scaleX")) || 1;
          const sy = Number(gsap.getProperty(clone, "scaleY")) || 1;
          snap = gsap.to(clone, {
            transformOrigin: "0 0",
            ...cloneFit(clone.getBoundingClientRect(), source.el!, sx, sy),
            duration: 0.22,
            ease: "power2.inOut",
            onComplete: () => {
              document.documentElement.classList.remove("menu-open");
              gsap.set(clone, { autoAlpha: 0 });
            },
          });
        });
        tl.to({}, { duration: 0.24 });
      } else {
        tl.add(() => document.documentElement.classList.remove("menu-open"));
      }
      return () => {
        snap?.kill();
        tl.kill();
      };
    }

    gsap.set(items, { yPercent: 115, opacity: 0 });
    gsap.set(gloss ?? [], { opacity: 0 });
    if (letterNodes?.length) gsap.set(letterNodes, { x: 0, y: 0, rotation: 0, opacity: 1 });
    const clone = lettersRef.current;
    if (clone && source.el) {
      gsap.set(clone, { transformOrigin: "0 0", scaleX: 1, scaleY: 1, x: 0, y: 0 });
      gsap.set(clone, cloneFit(clone.getBoundingClientRect(), source.el, 1, 1));
    }

    const tl = gsap.timeline();
    if (letterNodes?.length) {
      if (source.script) {
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
    const namesAt = letterNodes?.length ? 0.55 : 0.12;
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
  }, [closing, onClosed, source.script]);

  const go = (href: string) => {
    if (traveling.current || closing) return;
    const nav = navRef.current;
    const holder = rootRef.current;
    const chosen = nav?.querySelector<HTMLElement>(`[data-href="${href}"]`);
    const others = nav?.querySelectorAll<HTMLElement>(`[data-item]:not([data-href="${href}"])`);
    const gloss = nav?.querySelectorAll<HTMLElement>("[data-gloss]");
    if (!chosen || !holder) return;
    traveling.current = true;
    onTravelStart();

    const reduced = window.matchMedia(REDUCED).matches;
    const finish = () => {
      document.documentElement.classList.remove("menu-open");
      document.documentElement.classList.remove("menu-travel");
      onTravelEnd();
    };

    const scrollThenLand = () => {
      document.documentElement.classList.remove("menu-open");
      document.documentElement.classList.add("menu-travel");
      getLenis()?.start();
      const lenis = getLenis();
      const afterScroll = () => land(chosen, href, holder, finish);
      if (lenis) lenis.scrollTo(href, { duration: reduced ? 0 : 1.25, onComplete: afterScroll });
      else {
        document.querySelector(href)?.scrollIntoView();
        afterScroll();
      }
    };

    if (reduced) {
      scrollThenLand();
      return;
    }

    const tl = gsap.timeline({ onComplete: scrollThenLand });
    tl.to(gloss ?? [], { opacity: 0, duration: 0.22, ease: "power2.inOut" }, 0);
    if (others?.length) {
      tl.to(others, { yPercent: 115, opacity: 0, duration: 0.48, stagger: 0.06, ease: "power2.inOut" }, 0);
    }
  };

  const stackTop = Math.max(
    88,
    Math.min(
      source.top + source.height / 2 - fit * 2.15,
      window.innerHeight - fit * 4.4 - 32,
    ),
  );

  const navW = Math.min(window.innerWidth * 0.92, 72 * 16);
  const alignStyle: CSSProperties =
    source.align === "center"
      ? { left: 0, right: 0, marginInline: "auto", textAlign: "center" }
      : source.align === "right"
        ? { right: 24, textAlign: "right" }
        : {
            left: Math.max(20, Math.min(source.left, window.innerWidth - navW - 20)),
            textAlign: "left",
          };

  const typeClass = source.script ? "script" : source.outline ? "caps caps-outline" : "caps";

  return (
    <div
      ref={rootRef}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Меню"
      className="fixed inset-0 z-[55]"
    >
      <div className="menu-veil" aria-hidden />
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Закрыть меню"
        onClick={onRequestClose}
      />
      {letters.length > 0 && (
        <div
          ref={lettersRef}
          className={`pointer-events-none fixed whitespace-nowrap select-none ${typeClass}`}
          style={{
            left: source.left,
            top: source.top,
            fontSize: source.fontSize,
            fontFamily: source.fontFamily,
            fontWeight: source.fontWeight,
            letterSpacing: source.letterSpacing,
            color: source.color,
            lineHeight: source.script ? 0.9 : 0.82,
          }}
          aria-hidden
        >
          {source.script ? (
            <span data-letter className="inline-block will-change-transform">
              {source.text}
            </span>
          ) : (
            letters.map((ch, i) => (
              <span key={`${ch}-${i}`} data-letter className="inline-block will-change-transform">
                {ch === " " ? "\u00a0" : ch}
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
            <li key={n.href} className={source.script ? "overflow-hidden py-[0.3em] -my-[0.3em]" : "overflow-hidden"}>
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
                  className={`${typeClass} block leading-[0.82] transition-colors duration-200 group-hover:text-pompei group-focus-visible:text-pompei`}
                  style={source.script || source.outline ? undefined : { color: source.color }}
                >
                  {n.label}
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

function land(chosen: HTMLElement, href: string, holder: HTMLElement, done: () => void) {
  const dest = findMenuDest(href);
  const word = chosen.querySelector<HTMLElement>(":scope > span:first-child");
  if (!dest || !word) {
    gsap.to(chosen, { opacity: 0, duration: 0.2, onComplete: done });
    return;
  }
  if (window.matchMedia(REDUCED).matches) {
    done();
    return;
  }

  const from = word.getBoundingClientRect();
  const to = inkBox(dest);
  const destStyle = getComputedStyle(dest);
  const destText = (dest.dataset.menuWord || dest.textContent || "").replace(/\s+/g, " ").trim();

  gsap.set(word, {
    position: "fixed",
    left: from.left,
    top: from.top,
    margin: 0,
    zIndex: 58,
    whiteSpace: "nowrap",
  });
  holder.appendChild(word);

  const tl = gsap.timeline({
    onComplete: done,
  });
  tl.to(
    word,
    {
      left: to.left,
      top: to.top,
      fontSize: to.fontSize,
      color: destStyle.color,
      duration: 0.75,
      ease: "power2.inOut",
    },
    0,
  );
  tl.add(() => {
    if (destText && destText.toLowerCase() !== (word.textContent || "").trim().toLowerCase()) {
      word.textContent = destText;
    }
    if (dest.classList.contains("script")) {
      word.classList.add("script");
      word.classList.remove("caps", "caps-outline");
    }
  }, 0.38);
}
