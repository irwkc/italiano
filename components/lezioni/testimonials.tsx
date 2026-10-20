import { testimonials } from "@/lib/content";

const pos = [
  "lg:col-start-1 lg:col-span-5",
  "lg:col-start-7 lg:col-span-5 lg:mt-[18vh]",
  "lg:col-start-3 lg:col-span-5 lg:mt-[10vh]",
];

/** Три голоса учеников, рассыпаны по странице. */
export function Testimonials() {
  return (
    <section className="relative px-5 md:px-10 py-14 md:py-[14vh]" aria-label="Отзывы">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-12 lg:gap-y-[10vh]">
        {testimonials.map((t) => (
          <figure key={t.name} className={pos[testimonials.indexOf(t)]}>
            <blockquote className="reveal serif italic text-[1.45rem] leading-[1.18] md:text-[2rem] md:leading-[1.15] pb-1">
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
