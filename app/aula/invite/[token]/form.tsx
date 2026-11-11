"use client";

import { useActionState } from "react";
import { registerInviteAction } from "@/learn/actions";

export function InviteForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(registerInviteAction, null);

  if (state?.ok) {
    return (
      <div>
        <h1>Aula</h1>
        <p className="aula-muted">{state.ok}</p>
      </div>
    );
  }

  return (
    <form action={action}>
      <h1>Aula</h1>
      <p className="aula-muted">Регистрация по приглашению.</p>
      <input type="hidden" name="inviteToken" value={token} />
      <label className="aula-label">
        Имя
        <input className="field" name="name" required autoComplete="name" />
      </label>
      <label className="aula-label">
        Email
        <input className="field" name="email" type="email" required autoComplete="email" />
      </label>
      <label className="aula-label">
        Пароль (от 8 символов)
        <input className="field" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </label>
      {state?.error ? <p className="aula-err">{state.error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        Создать аккаунт
      </button>
    </form>
  );
}
