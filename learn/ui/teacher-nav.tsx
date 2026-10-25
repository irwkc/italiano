import Link from "next/link";

export function TeacherNav({ current }: { current: "live" | "schede" | "studenti" | "orario" }) {
  const items = [
    { id: "live" as const, href: "/aula/insegnante", label: "Live" },
    { id: "schede" as const, href: "/aula/insegnante/schede", label: "Schede" },
    { id: "studenti" as const, href: "/aula/insegnante/studenti", label: "Studenti" },
    { id: "orario" as const, href: "/aula/insegnante/orario", label: "Orario" },
  ];

  return (
    <nav className="aula-tabs" aria-label="Кабинет преподавателя">
      {items.map((item) => (
        <Link key={item.id} href={item.href} className={item.id === current ? "is-on" : ""}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
