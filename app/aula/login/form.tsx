"use client";

import { useActionState, useState } from "react";
import { loginStudentAction, loginTeacherAction } from "@/learn/actions";

export function LoginForm({ banner = null }: { banner?: string | null }) {
  const [mode, setMode] = useState<"student" | "teacher">("student");
  const [teacherState, teacherAction, teacherPending] = useActionState(loginTeacherAction, null);
  const [studentState, studentAction, studentPending] = useActionState(loginStudentAction, null);

  return (
    <div className="aula-login-card">
      <h1>Aula</h1>
      {banner ? <p className="aula-err">{banner}</p> : null}
      <div className="aula-ask aula-login-mode" role="tablist" aria-label="Кто входит">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "student"}
          className={mode === "student" ? "is-on" : ""}
          onClick={() => setMode("student")}
        >
          Ученик
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "teacher"}
          className={mode === "teacher" ? "is-on" : ""}
          onClick={() => setMode("teacher")}
        >
          Преподаватель
        </button>
      </div>

      {mode === "student" ? (
        <form action={studentAction}>
          <p className="aula-muted">Email и пароль после приглашения.</p>
          <label className="aula-label">
            Email
            <input className="field" name="email" type="email" autoComplete="email" required />
          </label>
          <label className="aula-label">
            Пароль
            <input className="field" name="password" type="password" autoComplete="current-password" required />
          </label>
          {studentState?.error ? <p className="aula-err">{studentState.error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={studentPending}>
            Entrare
          </button>
        </form>
      ) : (
        <form action={teacherAction}>
          <p className="aula-muted">Имя и пароль преподавателя.</p>
          <label className="aula-label">
            Имя
            <input className="field" name="name" defaultValue="Giacomo" autoComplete="username" required />
          </label>
          <label className="aula-label">
            Пароль
            <input className="field" name="password" type="password" autoComplete="current-password" required />
          </label>
          {teacherState?.error ? <p className="aula-err">{teacherState.error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={teacherPending}>
            Entrare
          </button>
        </form>
      )}
    </div>
  );
}
