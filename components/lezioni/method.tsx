import { ScriptWrite } from "@/components/script-write";
import { method } from "@/lib/content";

/** Десктоп: сверху вниз по порядку, каждый на своей ширине. */
const placeDesk = [
  "col-start-1 col-span-7",
  "col-start-6 col-span-7",
  "col-start-3 col-span-7",
  "col-start-7 col-span-6",
];

/** Как проходит урок. Два дерева: телефон и десктоп. */
export function Method() {
  return (
    <section
      id="lezioni"
      data-menu-gather="ITALIA"
      className="relative overflow-visible px-5 md:px-10 py-14 md:py-[14vh]"
      aria-label="Как проходит урок"
    >
      <h2 className="reveal serif text-[1.4rem] md:text-[1.9rem] text-ink-soft mb-10 md:mb-[5vh]">{method.title}</h2>

      {/* Phone */}
      <ol className="grid grid-cols-1 gap-y-12 md:hidden">
        {method.steps.map((s, i) => {
          const right = i % 2 === 1;
          return (
            <li key={`m-${s.verb}`}>
              <div className={right ? "text-right" : ""}>
                <ScriptWrite
                  text={s.verb}
                  accent={s.accent}
                  data-menu-word={s.verb}
                  className="text-ink whitespace-nowrap"
                  style={{ fontSize: "clamp(2.6rem, 12vw, 4rem)" }}
                  start="top 90%"
                  end="top 50%"
                />
                <span className={`reveal label mt-2 block text-pompei ${right ? "text-right" : ""}`}>
                  {s.ru}
                </span>
              </div>
              <p className="reveal mt-3 text-ink-soft text-[0.95rem] leading-relaxed">{s.body}</p>
            </li>
          );
        })}
      </ol>

      {/* Desktop: без CSS-mask — маска резала выносные */}
      <ol className="hidden md:grid grid-cols-12 gap-x-4 gap-y-[2.5vh] overflow-visible">
        {method.steps.map((s, i) => (
          <li
            key={`d-${s.verb}`}
            className={`${placeDesk[i]} relative grid grid-cols-6 gap-x-5 items-end overflow-visible`}
          >
            <div className="col-span-4 -ml-[0.6vw] overflow-visible">
              <ScriptWrite
                text={s.verb}
                accent={s.accent}
                mask={false}
                data-menu-word={s.verb}
                className="text-ink whitespace-nowrap"
                style={{ fontSize: "clamp(3.8rem, 12vw, 11rem)" }}
                start="top 90%"
                end="top 50%"
              />
            </div>
            <div className="col-span-2 pb-2">
              <span className="reveal label block text-pompei">{s.ru}</span>
              <p className="reveal mt-2 text-ink-soft text-[0.9rem] leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
