import { ParallaxField } from "@/components/parallax-field";
import { oggi } from "@/lib/content";

const phoneWords = [
  { text: "Allora", x: 2, y: 4, speed: 0.4, size: 12, red: false },
  { text: "Dai!", x: 58, y: 2, speed: 1.5, size: 15, red: true },
  { text: "Boh", x: 6, y: 28, speed: 0.9, size: 17, red: false },
  { text: "Magari", x: 54, y: 26, speed: 0.35, size: 9, red: false },
  { text: "Andiamo", x: 2, y: 62, speed: 1.2, size: 11, red: false },
  { text: "Figurati", x: 48, y: 58, speed: 0.65, size: 10, red: false },
  { text: "Mamma mia", x: 18, y: 84, speed: 1.35, size: 11, red: true },
];

/** Глава IV. Сегодняшняя Италия: разговорные словечки рассыпаны и едут с разной скоростью. */
export function Oggi() {
  return (
    <ParallaxField
      data-year={oggi.year}
      className="relative h-[118vh] md:h-[200vh]"
      range={240}
    >
      {phoneWords.map((w) => (
        <span
          key={`m-${w.text}`}
          data-speed={w.speed}
          className="absolute whitespace-nowrap select-none will-change-transform md:hidden"
          style={{ left: `${w.x}%`, top: `${w.y}%` }}
          aria-hidden
        >
          <span
            className={`script block ${w.red ? "text-pompei" : "text-ink"}`}
            style={{ fontSize: `clamp(2.1rem, ${w.size}vw, 3.8rem)` }}
          >
            {w.text}
          </span>
        </span>
      ))}

      {oggi.words.map((w) => (
        <span
          key={w.text}
          data-speed={w.speed}
          className="absolute hidden md:block whitespace-nowrap select-none will-change-transform"
          style={{ left: `${w.x}%`, top: `${w.y}%` }}
          aria-hidden
        >
          <span
            className={`script block pr-[0.3em] ${w.red ? "text-pompei" : "text-ink"}`}
            style={{
              fontSize: `clamp(2.5rem, ${w.size}vw, ${w.size * 1.1}rem)`,
              translate: `min(0px, calc(97vw - 100% - ${w.x}vw))`,
            }}
          >
            {w.text}
          </span>
        </span>
      ))}

      <div
        data-speed="0.92"
        className="absolute left-5 right-5 top-[38%] md:left-[24%] md:right-auto md:top-[60%] md:w-[min(36vw,28rem)]"
      >
        <h2 className="reveal serif text-[1.5rem] leading-[1.08] md:text-[3rem] md:leading-[1.03] pb-1">
          {oggi.title}
        </h2>
        <p className="reveal mt-3 md:mt-5 serif italic text-[1.2rem] leading-[1.15] md:text-[1.9rem] text-pompei pb-1">
          {oggi.body}
        </p>
      </div>
    </ParallaxField>
  );
}
