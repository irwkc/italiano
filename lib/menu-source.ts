export type MenuSource = {
  el: HTMLElement | null;
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  letterSpacing: string;
  color: string;
  align: "left" | "center" | "right";
  outline: boolean;
  script: boolean;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/** Рамка чернил без запаса `.write`, иначе калиграфия уезжает. */
export function inkBox(el: HTMLElement, rect = el.getBoundingClientRect()) {
  const fontSize = parseFloat(getComputedStyle(el).fontSize) || 96;
  const write = el.classList.contains("write");
  const padX = write ? fontSize * 0.4 : 0;
  const padY = write ? fontSize * 0.45 : 0;
  return {
    left: rect.left + padX,
    top: rect.top + padY,
    width: Math.max(1, rect.width - padX * 2),
    height: Math.max(1, rect.height - padY * 2),
    fontSize,
  };
}

export function fallbackSource(): MenuSource {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const fontSize = Math.min(vw * 0.18, vh * 0.22, 220);
  return {
    text: "",
    left: vw * 0.08,
    top: vh * 0.28,
    width: vw * 0.84,
    height: fontSize,
    fontSize,
    el: null,
    fontFamily: getComputedStyle(document.documentElement).getPropertyValue("--font-serif") || "serif",
    fontWeight: "500",
    letterSpacing: "-0.02em",
    color: getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#1c1915",
    align: "center",
    outline: false,
    script: false,
  };
}

export function findMenuSource(): MenuSource {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const nodes = document.querySelectorAll<HTMLElement>("[data-menu-word]");
  let bestEl: HTMLElement | null = null;
  let bestRect: DOMRect | null = null;
  let bestScore = -1;

  for (const el of nodes) {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    if (parseFloat(style.opacity) < 0.28) continue;
    if (style.visibility === "hidden") continue;
    const visW = Math.min(rect.right, vw) - Math.max(rect.left, 0);
    const visH = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    if (visW < 48 || visH < 36) continue;
    if (rect.height > vh * 1.55 || rect.width > vw * 1.7) continue;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(cx - vw / 2, cy - vh / 2);
    const score = visW * visH / (1 + dist * 0.45);
    if (score > bestScore) {
      bestEl = el;
      bestRect = rect;
      bestScore = score;
    }
  }

  if (!bestEl || !bestRect) return fallbackSource();

  const el = bestEl;
  const style = getComputedStyle(el);
  const ink = inkBox(el, bestRect);
  const cx = ink.left + ink.width / 2;
  const align: MenuSource["align"] =
    cx < vw * 0.36 ? "left" : cx > vw * 0.64 ? "right" : "center";
  return {
    el,
    text: (el.dataset.menuWord || el.textContent || "").replace(/\s+/g, " ").trim(),
    left: ink.left,
    top: ink.top,
    width: ink.width,
    height: ink.height,
    fontSize: ink.fontSize,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    color: style.color,
    align,
    outline: el.classList.contains("caps-outline") || Boolean(el.querySelector(".caps-outline")),
    script: el.classList.contains("script"),
  };
}

/** Рамка, в которую надо посадить клон: inkBox для калиграфии, иначе видимый rect. */
export function cloneFit(
  cloneRect: DOMRect,
  orig: HTMLElement,
  scaleX = 1,
  scaleY = 1,
) {
  const to = orig.classList.contains("write") ? inkBox(orig) : orig.getBoundingClientRect();
  return {
    left: to.left,
    top: to.top,
    scaleX: cloneRect.width ? scaleX * (to.width / cloneRect.width) : scaleX,
    scaleY: cloneRect.height ? scaleY * (to.height / cloneRect.height) : scaleY,
  };
}

/** Высота четырёх пунктов с русскими подписями. У script глифы выше line-height. */
export function menuStackHeight(fit: number, script = false) {
  return script ? fit * 7.6 + 80 : fit * 5.28 + 60;
}

export function menuFitSize(source: MenuSource, longest: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const byHeight = source.script ? (vh - 120) / 7.6 : (vh - 176) / 5.28;
  const char = source.script ? 0.9 : 0.62;
  const byWidth = (vw * 0.88) / Math.max(longest * char, 1);
  return clamp(Math.min(source.fontSize, byHeight, byWidth), 42, 220);
}

/** Держит стек в экране: сначала двигает вверх, если не влезает — уменьшает кегль. */
export function clampMenuNav(nav: HTMLElement, topMin = 88, padBot = 28) {
  const floor = window.innerHeight - padBot;
  const rect = nav.getBoundingClientRect();
  const overflow = rect.bottom - floor;
  if (overflow > 0) {
    nav.style.top = `${Math.max(topMin, rect.top - overflow)}px`;
  }
  const after = nav.getBoundingClientRect();
  const still = after.bottom - floor;
  if (still <= 0) return;
  const room = floor - topMin;
  if (after.height <= 0 || after.height <= room) {
    nav.style.top = `${topMin}px`;
    return;
  }
  const fs = parseFloat(getComputedStyle(nav).fontSize);
  nav.style.fontSize = `${Math.max(42, fs * (room / after.height))}px`;
  nav.style.top = `${topMin}px`;
}
