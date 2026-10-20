export type MenuLine = {
  text: string;
  fontSize: number;
  letterSpacing: string;
  /** Отрицательный отступ в em от кегля строки (как -mt-[0.06em] в hero). */
  marginTopEm: number;
};

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
  paddingLeft: string;
  lineHeight: string;
  align: "left" | "center" | "right";
  outline: boolean;
  script: boolean;
  /** Целиком, без разлёта букв (скрипт, цифры). Стеки ITA/LI/ANO — по буквам. */
  solid: boolean;
  /** Строки как в hero: ITA / LI / ANO. */
  lines?: MenuLine[];
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/** Максимальный кегль у элемента и видимых потомков — у стека ITA/LI/ANO на h1 иначе наследуется 16px. */
export function effectiveFontSize(el: HTMLElement) {
  const own = parseFloat(getComputedStyle(el).fontSize) || 0;
  let max = own;
  el.querySelectorAll<HTMLElement>("*").forEach((child) => {
    const cs = getComputedStyle(child);
    if (cs.display === "none") return;
    const fs = parseFloat(cs.fontSize) || 0;
    if (fs > max) max = fs;
  });
  return max || 96;
}

/** Рамка чернил без запаса `.write`, иначе калиграфия уезжает. */
export function inkBox(el: HTMLElement, rect = el.getBoundingClientRect()) {
  const fontSize = effectiveFontSize(el);
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
    paddingLeft: "0px",
    lineHeight: "0.74",
    align: "center",
    outline: false,
    script: false,
    solid: true,
    lines: undefined,
  };
}

function readMenuLines(el: HTMLElement): MenuLine[] | undefined {
  const nodes = el.querySelectorAll<HTMLElement>("[data-menu-line]");
  if (nodes.length < 2) return undefined;
  return [...nodes].map((line) => {
    const cs = getComputedStyle(line);
    const fontSize = parseFloat(cs.fontSize) || 96;
    const marginPx = parseFloat(cs.marginTop) || 0;
    return {
      text: (line.textContent || "").replace(/\s+/g, "").trim(),
      fontSize,
      letterSpacing: cs.letterSpacing,
      marginTopEm: fontSize ? marginPx / fontSize : 0,
    };
  });
}

function isPhone() {
  return window.innerWidth < 768;
}

export function findMenuSource(): MenuSource {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const phone = isPhone();
  const nodes = document.querySelectorAll<HTMLElement>("[data-menu-word]");
  let bestEl: HTMLElement | null = null;
  let bestRect: DOMRect | null = null;
  let bestScore = -1;

  for (const el of nodes) {
    const style = getComputedStyle(el);
    if (style.display === "none") continue;
    if (style.visibility === "hidden") continue;
    if (parseFloat(style.opacity) < 0.28) continue;
    // Скрытый десктопный дубль внутри md:hidden / hidden md:block
    let buried = false;
    for (let p: HTMLElement | null = el; p; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.display === "none" || ps.visibility === "hidden") {
        buried = true;
        break;
      }
    }
    if (buried) continue;

    const rect = el.getBoundingClientRect();
    const visW = Math.min(rect.right, vw) - Math.max(rect.left, 0);
    const visH = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    const minVis = phone ? 20 : 48;
    if (visW < minVis || visH < (phone ? 20 : 36)) continue;
    // Многострочный ITALIANO / широкие A PRESTO на телефоне больше старых лимитов
    if (rect.height > vh * (phone ? 2.2 : 1.55)) continue;
    if (rect.width > vw * (phone ? 3.2 : 1.7)) continue;

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
  const text = (el.dataset.menuWord || el.textContent || "").replace(/\s+/g, " ").trim();
  const script = el.classList.contains("script");
  const lines = readMenuLines(el);
  const forcedSolid = el.dataset.menuSolid !== undefined;
  // Стеки с data-menu-line разлетаются по буквам; solid — скрипт / цифры / явный data-menu-solid.
  const solid =
    !lines?.length &&
    (script || forcedSolid || (phone && /[0-9]/.test(text)) || ink.height > ink.fontSize * 2.1);

  return {
    el,
    text,
    left: ink.left,
    top: ink.top,
    width: ink.width,
    height: ink.height,
    fontSize: ink.fontSize,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    color: style.color,
    paddingLeft: style.paddingLeft,
    lineHeight: style.lineHeight,
    align,
    outline: el.classList.contains("caps-outline") || Boolean(el.querySelector(".caps-outline")),
    script,
    solid,
    lines,
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
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const byHeight = source.script ? (vh - 120) / 7.6 : (vh - 176) / 5.28;
  const char = source.script ? 0.9 : 0.62;
  const byWidth = (vw * 0.88) / Math.max(longest * char, 1);
  const floor = vw < 480 ? 28 : 42;
  return clamp(Math.min(source.fontSize, byHeight, byWidth), floor, 220);
}

/** Кегль клона слова: на телефоне однострочный ITALIANO не должен вылезать за экран. */
export function menuCloneSize(source: MenuSource) {
  if (source.lines?.length) return source.fontSize;
  const vw = window.innerWidth;
  if (!source.solid || source.script) return source.fontSize;
  const chars = Math.max(source.text.replace(/\s/g, "").length, 1);
  const fit = (vw * 0.92) / (chars * 0.58);
  return Math.min(source.fontSize, fit);
}

/** Держит стек в экране: сначала двигает вверх, если не влезает — уменьшает кегль. */
export function clampMenuNav(nav: HTMLElement, topMin = 88, padBot = 28) {
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const inset = window.innerWidth < 768 ? 72 : topMin;
  const floor = vh - padBot;
  const rect = nav.getBoundingClientRect();
  const overflow = rect.bottom - floor;
  if (overflow > 0) {
    nav.style.top = `${Math.max(inset, rect.top - overflow)}px`;
  }
  const after = nav.getBoundingClientRect();
  const still = after.bottom - floor;
  if (still <= 0) return;
  const room = floor - inset;
  if (after.height <= 0 || after.height <= room) {
    nav.style.top = `${inset}px`;
    return;
  }
  const fs = parseFloat(getComputedStyle(nav).fontSize);
  const min = window.innerWidth < 480 ? 28 : 42;
  nav.style.fontSize = `${Math.max(min, fs * (room / after.height))}px`;
  nav.style.top = `${inset}px`;
}
