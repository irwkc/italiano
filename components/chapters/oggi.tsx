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
          className={`absolute whitespace-nowrap select-none will-change-transform ${
            i % 3 === 2 ? "hidden md:block" : ""
          }`}
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

      <div className="absolute left-[8%] top-[58%] w-[min(84vw,34rem)] md:left-[24%] md:top-[60%] md:w-[min(36vw,28rem)]">
        <h2 className="reveal serif text-[1.9rem] md:text-[3rem] leading-[1.03]">{oggi.title}</h2>
        <p className="reveal mt-5 serif italic text-[1.4rem] md:text-[1.9rem] text-pompei">{oggi.body}</p>
      </div>
    </ParallaxField>
  );
}
