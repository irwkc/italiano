import { hashPassword, hashToken, randomToken } from "@/learn/crypto";
import { mutateStore } from "@/learn/data/store";
import { appUrl, sendMail } from "@/learn/mail";

const CONFIRM_HOURS = 48;

export type RegisterInput = {
  inviteToken: string;
  name: string;
  email: string;
  password: string;
  consent: boolean;
};

export type RegisterResult =
  | { ok: true; email: string; message: string }
  | { ok: false; status: number; code: "validation_error" | "not_found" | "conflict"; message: string };

export async function registerStudentByInvite(input: RegisterInput): Promise<RegisterResult> {
  const inviteToken = input.inviteToken.trim();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!input.consent) {
    return {
      ok: false,
      status: 400,
      code: "validation_error",
      message: "Нужно согласие на обработку персональных данных.",
    };
  }
  if (!inviteToken || !name || !email || password.length < 8) {
    return {
      ok: false,
      status: 400,
      code: "validation_error",
      message: "Имя, email и пароль от 8 символов.",
    };
  }

  const inviteHash = hashToken(inviteToken);
  let confirmRaw = "";
  const fail: { status: number; code: "not_found" | "conflict"; message: string } = {
    status: 0,
    code: "not_found",
    message: "",
  };
  let failed = false;

  await mutateStore((draft) => {
    const invite = draft.invites.find((item) => item.tokenHash === inviteHash);
    if (!invite) {
      failed = true;
      fail.status = 404;
      fail.code = "not_found";
      fail.message = "Ссылка недействительна.";
      return;
    }
    if (invite.usedAt) {
      failed = true;
      fail.status = 409;
      fail.code = "conflict";
      fail.message = "Ссылка уже использована.";
      return;
    }
    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      failed = true;
      fail.status = 409;
      fail.code = "conflict";
      fail.message = "Срок приглашения истёк.";
      return;
    }
    if (draft.students.some((s) => s.email === email)) {
      failed = true;
      fail.status = 409;
      fail.code = "conflict";
      fail.message = "Этот email уже зарегистрирован.";
      return;
    }
    const studentId = `st-${crypto.randomUUID()}`;
    draft.students.push({
      id: studentId,
      teacherId: draft.teacher.id,
      name,
      email,
      passwordHash: hashPassword(password),
      emailVerifiedAt: null,
    });
    invite.usedAt = new Date().toISOString();
    confirmRaw = randomToken();
    draft.emailTokens.push({
      id: `et-${crypto.randomUUID()}`,
      studentId,
      tokenHash: hashToken(confirmRaw),
      kind: "confirm",
      expiresAt: new Date(Date.now() + CONFIRM_HOURS * 60 * 60 * 1000).toISOString(),
      usedAt: null,
    });
  });

  if (failed) return { ok: false, status: fail.status, code: fail.code, message: fail.message };

  const link = `${appUrl()}/aula/confirm/${confirmRaw}`;
  const mailed = await sendMail(
    email,
    "Подтвердите email — Aula Giacomo",
    `Ciao, ${name}!\n\nПодтвердите почту, чтобы войти в кабинет:\n${link}\n\nСсылка действует ${CONFIRM_HOURS} часов.`,
  );
  if (!mailed.ok) {
    return {
      ok: true,
      email,
      message: `Аккаунт создан. Письмо не ушло (${mailed.error}). Откройте ссылку: ${link}`,
    };
  }
  return {
    ok: true,
    email,
    message: "Проверьте почту — пришло письмо со ссылкой подтверждения.",
  };
}
