import { testimonials } from "@/lib/content";

const pos = [
  "md:col-start-1 md:col-span-5",
  "md:col-start-7 md:col-span-5 md:mt-[18vh]",
  "md:col-start-3 md:col-span-5 md:mt-[10vh]",
];

/** Три голоса учеников, рассыпаны по странице. */
export function Testimonials() {
  return (
    <section className="relative px-5 md:px-10 py-[14vh]" aria-label="Отзывы">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-[10vh]">
        {testimonials.map((t) => (
          <figure key={t.name} className={pos[testimonials.indexOf(t)]}>
            <blockquote className="reveal serif italic text-[1.5rem] md:text-[2rem] leading-[1.15]">
              «{t.quote}»
            </blockquote>
            <figcaption className="reveal label mt-5">
              {t.name}
              <br />
              <span className="text-ink-soft/70">{t.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
