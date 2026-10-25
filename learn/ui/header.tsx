"use client";

import { useEffect, useState } from "react";
import { logoutStudentAction, logoutTeacherAction } from "@/learn/actions";

export function AulaHeader({
  name,
  role,
}: {
  name: string;
  role: "teacher" | "student";
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sync = () => setScrolled(window.scrollY > 0);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return (
    <header className={`aula-bar${scrolled ? " is-scrolled" : ""}`}>
      <span className="aula-g" aria-hidden>
        G
      </span>
      <span className="aula-who">{name}</span>
      <form action={role === "teacher" ? logoutTeacherAction : logoutStudentAction}>
        <button type="submit" className="aula-out">
          Выйти
        </button>
      </form>
    </header>
  );
}
