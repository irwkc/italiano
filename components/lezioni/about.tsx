import { ScriptWrite } from "@/components/script-write";
import { Sketch } from "@/components/sketch";
import { PhoneDrift } from "@/components/phone-drift";
import { about, site } from "@/lib/content";

/** Кто ведёт уроки. Подпись пишется, факты рассыпаны по полям. */
export function About() {
  return (
    <section id="giacomo" className="relative px-5 md:px-10 pt-16 pb-14 md:min-h-[100dvh] md:py-[18vh]" aria-label="Джакомо">
      {about.facts.map((f) => (
        <span
          key={f.text}
          className="label absolute hidden lg:block max-w-[14ch]"
          style={{ left: `${f.x}%`, top: `${f.y}%` }}
        >
          {f.text}
        </span>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-6">
        <div className="relative lg:col-span-7 lg:col-start-1 md:-ml-[2vw]">
          <ScriptWrite
            text={about.script}
            data-menu-word="Giacomo"
            className="relative z-10 text-ink whitespace-nowrap"
            style={{ fontSize: "clamp(3.4rem, 20vw, 24rem)" }}
          />
          <PhoneDrift from={28} to={-36} className="relative z-0 -mt-3 ml-0 w-full md:-mt-10 md:ml-[6vw] md:w-[min(92vw,32rem)] lg:w-[36vw]">
            <Sketch
              src="/sketch/sketch-giacomo-earring.jpg"
              alt="Карандашный портрет Джакомо в лавровом венке"
              width={864}
              height={1152}
              sizes="(min-width: 1024px) 36vw, (min-width: 768px) 92vw, 100vw"
            />
          </PhoneDrift>
        </div>
        <div className="lg:col-span-4 lg:col-start-8 mt-8 lg:mt-[28vh]">
          <p className="reveal serif text-[1.45rem] leading-[1.12] md:text-[2rem] md:leading-[1.1] pb-1">{about.lead}</p>
          <p className="reveal mt-4 md:mt-6 text-ink-soft text-[0.9rem] md:text-base leading-relaxed">{about.body}</p>
          <div className="mt-6 md:mt-8 flex flex-col items-start gap-1">
            <a
              href={site.instagram}
              target="_blank"
              rel="noreferrer"
              className="reveal link label inline-flex min-h-11 items-center text-ink"
            >
              Instagram {site.instagramHandle}
            </a>
            <a
              href={site.telegram}
              target="_blank"
              rel="noreferrer"
              className="reveal link label inline-flex min-h-11 items-center text-ink"
            >
              Telegram {site.telegramHandle}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
