import { NextRequest } from "next/server";
import { verifyPassword } from "@/learn/crypto";
import { readStore } from "@/learn/data/store";
import { apiError, apiOk, clientIp, readJson } from "@/learn/mobile/http";
import { createMobileSession } from "@/learn/mobile/tokens";
import { rateLimit } from "@/learn/rate-limit";

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limited = rateLimit(`mobile-login:${ip}`, 20, 60_000);
  if (!limited.ok) {
    return apiError(429, "rate_limited", "Слишком много попыток. Подождите минуту.");
  }

  const body = await readJson<{ email?: string; password?: string }>(request);
  if (!body.ok) return body.response;
  const email = String(body.data.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(body.data.password ?? "");
  if (!email || !password) {
    return apiError(400, "validation_error", "Укажите email и пароль.");
  }

  const emailLimited = rateLimit(`mobile-login-email:${email}`, 20, 60_000);
  if (!emailLimited.ok) {
    return apiError(429, "rate_limited", "Слишком много попыток. Подождите минуту.");
  }

  const store = await readStore();
  const student = store.students.find((s) => s.email === email);
  if (!student || !student.passwordHash || !verifyPassword(password, student.passwordHash)) {
    return apiError(401, "invalid_credentials", "Email или пароль не подошли.");
  }
  if (!student.emailVerifiedAt) {
    return apiError(401, "email_unverified", "Сначала подтвердите email — ссылка в письме.");
  }

  const tokens = await createMobileSession(student, request.headers.get("user-agent") ?? undefined);
  return apiOk(tokens);
}
