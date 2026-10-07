import { site } from "@/lib/content";

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 grid grid-cols-12 gap-4 px-5 pt-5 md:px-10 md:pt-7 pointer-events-none">
      <div className="col-span-6 md:col-span-3 pointer-events-auto">
        <a href="#top" className="label block text-ink">
          Giacomo
          <br />
          <span className="text-ink-soft">italiano con un romano</span>
        </a>
      </div>
      <div className="hidden md:block md:col-span-6 text-center">
        <span className="script text-[1.75rem] leading-none text-pompei">G</span>
      </div>
      <nav className="col-span-6 md:col-span-3 flex justify-end pointer-events-auto">
        <ul className="label text-right md:text-left">
          {site.nav.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="link">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
