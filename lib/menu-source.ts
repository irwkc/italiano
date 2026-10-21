export type MenuLine = {
  text: string;
  fontSize: number;
  letterSpacing: string;
  /** Отрицательный отступ в em от кегля строки (как -mt-[0.06em] в hero). */
  marginTopEm: number;
};

/** Снимок красной буквы для клона (метод → italia). Без ссылок на живой DOM. */
export type MenuGatherLetter = {
  char: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  lineHeight: string;
  color: string;
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
  /** clip-path слоя заливки (.r-fill / .r-fill-m), напр. inset(50% …) пока ROMA набирает чернила. */
  fillClip?: string;
  /** Целиком, без разлёта букв (скрипт, цифры). Стеки ITA/LI/ANO — по буквам. */
  solid: boolean;
  /** Строки как в hero: ITA / LI / ANO. */
  lines?: MenuLine[];
  /** Красные акценты метода: клоны слетаются в italia. */
  gather?: MenuGatherLetter[];
  /** Слово под картинкой: сначала вывести вперёд, потом разлёт. */
  under?: boolean;
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
    fillClip: undefined,
    solid: true,
    lines: undefined,
    gather: undefined,
  };
}

function scoreRect(rect: DOMRect, vw: number, vh: number) {
  const visW = Math.min(rect.right, vw) - Math.max(rect.left, 0);
  const visH = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
  if (visW <= 0 || visH <= 0) return -1;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dist = Math.hypot(cx - vw / 2, cy - vh / 2);
  return (visW * visH) / (1 + dist * 0.45);
}

/** Секция «Как проходит урок»: красные буквы → клоны italia. */
function tryGatherSource(vw: number, vh: number): { source: MenuSource; score: number } | null {
  const root = document.querySelector<HTMLElement>("[data-menu-gather]");
  if (!root) return null;
  const style = getComputedStyle(root);
  if (style.display === "none" || style.visibility === "hidden") return null;

  const rootRect = root.getBoundingClientRect();
  const score = scoreRect(rootRect, vw, vh);
  const visH = Math.min(rootRect.bottom, vh) - Math.max(rootRect.top, 0);
  const minVis = vw < 768 ? vh * 0.28 : vh * 0.22;
  if (score < 0 || visH < minVis) return null;

  const nodes = [...root.querySelectorAll<HTMLElement>("[data-menu-accent]")].filter((el) => {
    if (el.getClientRects().length === 0) return false;
    for (let p: HTMLElement | null = el; p; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.display === "none" || ps.visibility === "hidden") return false;
    }
    return true;
  });
  const text = (root.dataset.menuGather || "").replace(/\s+/g, "");
  if (nodes.length < 2 || nodes.length !== text.length) return null;

  const gather: MenuGatherLetter[] = nodes.map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const fontSize = parseFloat(cs.fontSize) || 48;
    return {
      char: (el.textContent || "").trim().slice(0, 1),
      left: r.left,
      top: r.top,
      width: Math.max(1, r.width),
      height: Math.max(1, r.height),
      fontSize,
      fontFamily: cs.fontFamily,
      lineHeight: cs.lineHeight,
      color: cs.color,
    };
  });
  if (gather.some((g) => !g.char)) return null;

  const avg = gather.reduce((n, g) => n + g.fontSize, 0) / gather.length;
  const fontSize = Math.min(Math.max(avg * 1.05, vw * (vw < 768 ? 0.12 : 0.07)), vw < 768 ? 96 : 140);
  const width = gather.reduce((n, g) => n + g.width, 0);
  const left = (vw - width) / 2;
  const top = vh * 0.3;

  return {
    score: score * 1.4,
    source: {
      el: root,
      text: gather.map((g) => g.char).join(""),
      left,
      top,
      width,
      height: Math.max(...gather.map((g) => g.height)),
      fontSize,
      fontFamily: gather[0]!.fontFamily,
      fontWeight: "400",
      letterSpacing: "0.02em",
      color: gather[0]!.color,
      paddingLeft: "0px",
      lineHeight: gather[0]!.lineHeight,
      align: "center",
      outline: false,
      script: true,
      fillClip: undefined,
      solid: false,
      lines: undefined,
      gather,
    },
  };
}

/** Запас вокруг глифа: слой трансформации иначе режет росчерки Italianno. */
export function gatherInkPad(fontSize: number) {
  return fontSize * 0.6;
}

/**
 * Куда слетаются буквы: живая строка italia, не сумма чужих bounding-box.
 * left/top — верхний левый угол глифа, тот же бокс, что у клона без padding.
 */
export function measureGatherSlots(letters: MenuGatherLetter[], top: number, vw: number) {
  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:0;top:0;display:flex;align-items:baseline;white-space:nowrap;visibility:hidden;pointer-events:none;";
  const spans = letters.map((g) => {
    const s = document.createElement("span");
    s.className = "script";
    s.style.display = "inline-block";
    s.style.fontSize = `${g.fontSize}px`;
    s.style.fontFamily = g.fontFamily;
    s.style.lineHeight = "1";
    s.style.verticalAlign = "baseline";
    s.textContent = g.char;
    host.appendChild(s);
    return s;
  });
  document.body.appendChild(host);
  const hr = host.getBoundingClientRect();
  const dx = (vw - hr.width) / 2 - hr.left;
  const dy = top - hr.top;
  const slots = spans.map((s) => {
    const r = s.getBoundingClientRect();
    return { left: r.left + dx, top: r.top + dy };
  });
  host.remove();
  return slots;
}

/**
 * clip-path заливки ROMA в процентах по высоте.
 * getComputedStyle часто отдаёт inset в px от крупного слова — на пунктах меню
 * тот же px срезает всю заливку. Нормализуем top → %, чтобы уровень совпадал.
 */
function readFillClip(el: HTMLElement): string | undefined {
  const fill = el.querySelector<HTMLElement>(".r-fill, .r-fill-m, [data-menu-fill]");
  if (!fill) return undefined;
  const clip = getComputedStyle(fill).clipPath;
  if (!clip || clip === "none") return undefined;

  const inset = clip.match(/inset\(\s*([^)]+?)\s*\)/i);
  if (!inset) return clip;

  const topTok = inset[1].trim().split(/\s+/)[0];

  let topPct: number;
  if (topTok.endsWith("%")) {
    topPct = parseFloat(topTok);
  } else {
    const h = fill.getBoundingClientRect().height;
    if (h <= 0) return clip;
    const topPx = parseFloat(topTok);
    if (Number.isNaN(topPx)) return clip;
    topPct = (topPx / h) * 100;
  }

  if (Number.isNaN(topPct)) return clip;
  // Боковые -0.12em как в roma — не переносим px от крупного ROMA на мелкие пункты.
  return `inset(${topPct}% -0.12em -0.12em -0.12em)`;
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

/** Стили клона с глифа (.caps / .script), не с обёртки. */
function visualTypeEl(el: HTMLElement) {
  if (el.classList.contains("caps") || el.classList.contains("script")) return el;
  return el.querySelector<HTMLElement>(".caps, .script") ?? el;
}

/** Слово уже разрезано на буквы, как ITALIANO / LEZIONI. Иначе клон держим целиком. */
function isLetterSplit(el: HTMLElement) {
  const kids = [...el.children].filter((n): n is HTMLElement => {
    if (!(n instanceof HTMLElement)) return false;
    const s = getComputedStyle(n);
    return s.display !== "none" && s.visibility !== "hidden";
  });
  if (kids.length < 2) return false;
  return kids.every((k) => (k.textContent || "").replace(/\s/g, "").length === 1);
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

    const score = scoreRect(rect, vw, vh);
    if (score > bestScore) {
      bestEl = el;
      bestRect = rect;
      bestScore = score;
    }
  }

  const gather = tryGatherSource(vw, vh);
  if (gather && gather.score > bestScore) return gather.source;

  if (!bestEl || !bestRect) return gather?.source ?? fallbackSource();

  const el = bestEl;
  const typeEl = visualTypeEl(el);
  const style = getComputedStyle(typeEl);
  const typeRect = typeEl === el ? bestRect : typeEl.getBoundingClientRect();
  const ink = inkBox(typeEl, typeRect);
  const cx = ink.left + ink.width / 2;
  const align: MenuSource["align"] =
    cx < vw * 0.36 ? "left" : cx > vw * 0.64 ? "right" : "center";
  const text = (el.dataset.menuWord || typeEl.textContent || "").replace(/\s+/g, " ").trim();
  const script = typeEl.classList.contains("script");
  const lines = readMenuLines(el);
  const outline = typeEl.classList.contains("caps-outline") || Boolean(typeEl.querySelector(".caps-outline"));
  const fillClip = outline ? readFillClip(typeEl) : undefined;
  const solid = !lines?.length && !isLetterSplit(typeEl);

  return {
    el: typeEl,
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
    outline,
    script,
    fillClip,
    solid,
    lines,
    gather: undefined,
    under: el.dataset.menuUnder !== undefined || typeEl.dataset.menuUnder !== undefined,
  };
}

/**
 * Посадка клона на видимый глиф.
 * AVE масштабируется с центра — клон тоже. Write остаётся от левого верхнего чернил.
 */
export function cloneFit(cloneRect: DOMRect, orig: HTMLElement, scaleX = 1, scaleY = 1) {
  const to = orig.classList.contains("write") ? inkBox(orig) : orig.getBoundingClientRect();
  if (orig.classList.contains("write")) {
    return {
      left: to.left,
      top: to.top,
      xPercent: 0,
      yPercent: 0,
      scaleX: 1,
      scaleY: 1,
      transformOrigin: "0 0",
    };
  }
  // cloneRect уже с текущим scale — умножаем, иначе close ставит 1 и AVE прыгает.
  const sx = cloneRect.width ? scaleX * (to.width / cloneRect.width) : scaleX;
  const sy = cloneRect.height ? scaleY * (to.height / cloneRect.height) : scaleY;
  const scale = Math.abs(sx - sy) < 0.12 ? (sx + sy) / 2 : sx;
  return {
    left: to.left + to.width / 2,
    top: to.top + to.height / 2,
    xPercent: -50,
    yPercent: -50,
    scaleX: scale,
    scaleY: scale,
    transformOrigin: "50% 50%",
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

/** Кегль клона = кегль оригинала. Сжимать нельзя: VOLGARE специально шире экрана. */
export function menuCloneSize(source: MenuSource) {
  return source.fontSize;
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
