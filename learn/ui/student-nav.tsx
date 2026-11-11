import Link from "next/link";
import { mePath } from "@/learn/format";

export function StudentNav({ current }: { current: "home" | "orario" | "compiti" }) {
  const items = [
    { id: "home" as const, href: mePath(), label: "Live" },
    { id: "orario" as const, href: mePath("/orario"), label: "Orario" },
    { id: "compiti" as const, href: mePath("/compiti"), label: "Compiti" },
  ];
  return (
    <nav className="aula-tabs" aria-label="Кабинет">
      {items.map((item) => (
        <Link key={item.id} href={item.href} className={item.id === current ? "is-on" : ""}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
