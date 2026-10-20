import { formats } from "@/lib/content";

const offsets = ["md:mt-0", "md:mt-[22vh]", "md:mt-[44vh]"];
const starts = ["md:col-start-1", "md:col-start-5", "md:col-start-9"];

/** Форматы уроков как типографическое меню: три сдвинутые колонки. */
export function Formats() {
  return (
    <section id="lezioni" data-year="Oggi" className="relative pt-[14vh] pb-[22vh] overflow-hidden" aria-label="Форматы уроков">
      <span
        data-menu-word="LEZIONI"
        className="caps absolute -right-[5vw] top-[2vh] text-ink select-none whitespace-nowrap leading-[0.8]"
        style={{ fontSize: "clamp(5.5rem, 27vw, 34rem)" }}
        aria-hidden
      >
        {formats.word}
      </span>

      <div className="relative grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-16 px-5 md:px-10 mt-[26vw] md:mt-[22vw]">
        {formats.items.map((f, i) => (
          <article key={f.name} className={`md:col-span-4 ${starts[i]} ${offsets[i]}`}>
            <span className="reveal label block mb-5 text-pompei">{f.name}</span>
            <ul className="caps text-[1.6rem] md:text-[2.1rem] leading-[1.05] text-ink">
              {f.lines.map((l) => (
                <li key={l} className="reveal">
                  {l}
                </li>
              ))}
            </ul>
            <p className="reveal mt-6 text-ink-soft text-[0.95rem] leading-relaxed max-w-[24rem]">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
