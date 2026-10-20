import { footer, site } from "@/lib/content";

export function Footer() {
  return (
    <footer className="relative overflow-hidden pt-[6vh] pb-[16vh] md:pb-[12vh]" aria-label="Подвал">
      <div className="caps whitespace-nowrap select-none text-ink -ml-[2vw] leading-[0.8]" style={{ fontSize: "clamp(5rem, 23vw, 30rem)" }} aria-hidden>
        {footer.word}
      </div>
      <div className="grid grid-cols-12 gap-4 px-5 md:px-10 mt-12 label">
        <div className="col-span-6 md:col-span-3">
          Giacomo
          <br />
          <span className="text-ink-soft/70">{site.origin}</span>
        </div>
        <div className="col-span-6 md:col-span-3 md:col-start-7">
          <a href={site.instagram} target="_blank" rel="noreferrer" className="link">
            Instagram {site.instagramHandle}
          </a>
        </div>
        <div className="col-span-12 md:col-span-3 text-right mt-6 md:mt-0">MMXXVI</div>
      </div>
    </footer>
  );
}
