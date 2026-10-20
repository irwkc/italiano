import { ScriptWrite } from "@/components/script-write";
import { method } from "@/lib/content";

const place = [
  "md:col-start-1 md:col-span-6",
  "md:col-start-6 md:col-span-6",
  "md:col-start-3 md:col-span-6",
  "md:col-start-7 md:col-span-6",
];

/** Как проходит урок: четыре глагола лесенкой. На мобилке глагол+перевод чередуются слева/справа. */
export function Method() {
  return (
    <section className="relative px-5 md:px-10 py-14 md:py-[16vh]" aria-label="Как проходит урок">
      <h2 className="reveal serif text-[1.4rem] md:text-[1.9rem] text-ink-soft mb-10 md:mb-[8vh]">{method.title}</h2>
      <ol className="grid grid-cols-1 md:grid-cols-12 gap-y-12 md:gap-y-[10vh]">
        {method.steps.map((s, i) => {
          const right = i % 2 === 1;
          return (
            <li key={s.verb} className={`${place[i]} grid grid-cols-1 md:grid-cols-6 gap-x-6 items-end`}>
              <div className={`md:col-span-4 md:-ml-[0.6vw] ${right ? "text-right md:text-left" : ""}`}>
                <ScriptWrite
                  text={s.verb}
                  accent={s.accent}
                  className={`text-ink ${right ? "md:inline-block" : ""}`}
                  style={{ fontSize: "clamp(2.6rem, 12vw, 11rem)" }}
                  start="top 90%"
                  end="top 50%"
                />
                <span className={`reveal label mt-2 block text-pompei md:hidden ${right ? "text-right" : ""}`}>
                  {s.ru}
                </span>
              </div>
              <div className="md:col-span-2 pb-1 md:pb-3">
                <span className="reveal label hidden md:block text-pompei">{s.ru}</span>
                <p className="reveal mt-3 md:mt-2 text-ink-soft text-[0.95rem] leading-relaxed">{s.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
