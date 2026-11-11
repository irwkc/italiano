import nodemailer from "nodemailer";

function transport() {
  const host = process.env.SMTP_HOST ?? "smtp.mail.ru";
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export function mailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMail(to: string, subject: string, text: string) {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@localhost";
  const tx = transport();
  if (!tx) {
    console.warn("[aula-mail] SMTP not configured; message to", to, subject, text);
    return { ok: false as const, error: "Почта не настроена (SMTP_USER / SMTP_PASS)." };
  }
  try {
    await tx.sendMail({ from, to, subject, text });
    return { ok: true as const };
  } catch (error) {
    console.error("[aula-mail]", error);
    return { ok: false as const, error: "Не удалось отправить письмо." };
  }
}

export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
