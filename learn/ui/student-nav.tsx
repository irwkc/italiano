import Link from "next/link";
import { studentPath } from "@/learn/format";

export function StudentNav({ token, current }: { token: string; current: "home" | "orario" | "compiti" }) {
  const items = [
    { id: "home" as const, href: studentPath(token), label: "Live" },
    { id: "orario" as const, href: studentPath(token, "/orario"), label: "Orario" },
    { id: "compiti" as const, href: studentPath(token, "/compiti"), label: "Compiti" },
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
