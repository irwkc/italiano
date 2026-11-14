"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerInviteAction } from "@/learn/actions";

export function InviteForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(registerInviteAction, null);

  if (state?.ok) {
    return (
      <div className="aula-login-card">
        <h1>Aula</h1>
        <p className="aula-muted">{state.ok}</p>
      </div>
    );
  }

  return (
    <form action={action} className="aula-login-card">
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
      <label className="cookie-opt contact-consent">
        <input type="checkbox" name="consent" value="yes" required />
        <span>
          Согласен на обработку персональных данных по{" "}
          <Link href="/legal/platform-privacy" className="link">
            политике
          </Link>
        </span>
      </label>
      {state?.error ? <p className="aula-err">{state.error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        Создать аккаунт
      </button>
    </form>
  );
}
