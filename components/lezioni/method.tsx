import { ScriptWrite } from "@/components/script-write";
import { method } from "@/lib/content";

const place = [
  "md:col-start-1 md:col-span-6",
  "md:col-start-6 md:col-span-6",
  "md:col-start-3 md:col-span-6",
  "md:col-start-7 md:col-span-6",
];

/** Как проходит урок: четыре глагола лесенкой. */
export function Method() {
  return (
    <section className="relative px-5 md:px-10 py-[16vh]" aria-label="Как проходит урок">
      <h2 className="reveal serif text-[1.5rem] md:text-[1.9rem] text-ink-soft mb-[8vh]">{method.title}</h2>
      <ol className="grid grid-cols-1 md:grid-cols-12 gap-y-[10vh]">
        {method.steps.map((s, i) => (
          <li key={s.verb} className={`${place[i]} grid grid-cols-1 md:grid-cols-6 gap-x-6 items-end`}>
            <div className="md:col-span-4 -ml-[0.6vw]">
              <ScriptWrite
                text={s.verb}
                className="text-ink"
                style={{ fontSize: "clamp(3.75rem, 9.5vw, 11rem)" }}
                start="top 90%"
                end="top 50%"
              />
            </div>
            <div className="md:col-span-2 pb-3">
              <span className="reveal label block text-pompei">{s.ru}</span>
              <p className="reveal mt-2 text-ink-soft text-[0.95rem] leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
