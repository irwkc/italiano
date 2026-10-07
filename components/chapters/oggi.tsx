import { ParallaxField } from "@/components/parallax-field";
import { oggi } from "@/lib/content";

/** Глава IV. Сегодняшняя Италия: разговорные словечки рассыпаны и едут с разной скоростью. */
export function Oggi() {
  return (
    <ParallaxField
      data-year={oggi.year}
      className="relative h-[180vh] md:h-[200vh]"
      range={240}
    >
      {oggi.words.map((w, i) => (
        <span
          key={w.text}
          data-speed={w.speed}
          className={`script absolute whitespace-nowrap select-none will-change-transform ${
            w.red ? "text-pompei" : "text-ink"
          } ${i % 3 === 2 ? "hidden md:block" : ""}`}
          style={{
            left: `${w.x}%`,
            top: `${w.y}%`,
            fontSize: `clamp(2.5rem, ${w.size}vw, ${w.size * 1.1}rem)`,
          }}
          aria-hidden
        >
          {w.text}
        </span>
      ))}

      <div className="absolute left-1/2 -translate-x-1/2 bottom-[18vh] w-[min(90vw,42rem)] text-center">
        <h2 className="reveal serif text-[1.9rem] md:text-[3rem] leading-[1.03]">{oggi.title}</h2>
        <p className="reveal mt-5 serif italic text-[1.4rem] md:text-[1.9rem] text-pompei">{oggi.body}</p>
      </div>
    </ParallaxField>
  );
}
