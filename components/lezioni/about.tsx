import { ScriptWrite } from "@/components/script-write";
import { Sketch } from "@/components/sketch";
import { about, site } from "@/lib/content";

/** Кто ведёт уроки. Подпись пишется, факты рассыпаны по полям. */
export function About() {
  return (
    <section id="giacomo" className="relative min-h-[100dvh] px-5 md:px-10 py-[18vh]" aria-label="Джакомо">
      {about.facts.map((f) => (
        <span
          key={f.text}
          className="label absolute hidden md:block max-w-[14ch]"
          style={{ left: `${f.x}%`, top: `${f.y}%` }}
        >
          {f.text}
        </span>
      ))}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6">
        <div className="relative md:col-span-7 md:col-start-1 -ml-[2vw]">
          <ScriptWrite
            text={about.script}
            className="relative z-10 text-ink whitespace-nowrap"
            style={{ fontSize: "clamp(5rem, 20vw, 24rem)" }}
          />
          <div className="relative z-0 -mt-4 ml-[3vw] w-[min(92vw,32rem)] md:-mt-10 md:ml-[6vw] md:w-[36vw]">
            <Sketch
              src="/sketch/sketch-giacomo-earring.jpg"
              alt="Карандашный портрет Джакомо в лавровом венке"
              width={864}
              height={1152}
              sizes="(min-width: 768px) 36vw, 92vw"
            />
          </div>
        </div>
        <div className="md:col-span-4 md:col-start-8 mt-24 md:mt-[28vh]">
          <p className="reveal serif text-[1.6rem] md:text-[2rem] leading-[1.1]">{about.lead}</p>
          <p className="reveal mt-6 text-ink-soft text-[0.95rem] md:text-base leading-relaxed">{about.body}</p>
          <div className="mt-8 flex flex-col items-start gap-3">
            <a
              href={site.instagram}
              target="_blank"
              rel="noreferrer"
              className="reveal link label text-ink"
            >
              Instagram {site.instagramHandle}
            </a>
            <a
              href={site.telegram}
              target="_blank"
              rel="noreferrer"
              className="reveal link label text-ink"
            >
              Telegram {site.telegramHandle}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
