import { PhoneDrift } from "@/components/phone-drift";
import { footer, site } from "@/lib/content";

export function Footer() {
  return (
    <footer className="relative overflow-hidden pt-8 pb-[max(5.5rem,calc(10vh+env(safe-area-inset-bottom)))] md:pt-[6vh] md:pb-[12vh]" aria-label="Подвал">
      <PhoneDrift from={16} to={-12}>
        <div
          data-menu-word="A PRESTO"
          data-menu-solid
          className="caps w-full text-center whitespace-nowrap select-none text-ink leading-[0.8]"
          style={{ fontSize: "clamp(4.2rem, 22vw, 30rem)" }}
          aria-hidden
        >
          {footer.word}
        </div>
      </PhoneDrift>
      <div className="grid grid-cols-12 gap-4 px-5 md:px-10 mt-8 md:mt-12 label">
        <div className="col-span-6 md:col-span-3">
          Giacomo
          <br />
          <span className="text-ink-soft/70">{site.origin}</span>
        </div>
        <div className="col-span-6 md:col-span-3 md:col-start-7">
          <a href={site.instagram} target="_blank" rel="noreferrer" className="link inline-flex min-h-11 items-center">
            Instagram {site.instagramHandle}
          </a>
        </div>
        <div className="col-span-12 md:col-span-3 text-right mt-6 md:mt-0">MMXXVI</div>
      </div>
    </footer>
  );
}
