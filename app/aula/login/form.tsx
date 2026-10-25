"use client";

import { useActionState } from "react";
import { loginTeacherAction } from "@/learn/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginTeacherAction, null);

  return (
    <form action={action}>
      <h1>Aula</h1>
      <p className="aula-muted">Преподаватель. Имя и пароль.</p>
      <label className="aula-label">
        Имя
        <input className="field" name="name" defaultValue="Giacomo" autoComplete="username" required />
      </label>
      <label className="aula-label">
        Пароль
        <input className="field" name="password" type="password" autoComplete="current-password" required />
      </label>
      {state?.error ? <p className="aula-err">{state.error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        Entrare
      </button>
    </form>
  );
}
