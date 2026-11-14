import { NextRequest } from "next/server";
import { apiError, apiOk, clientIp, readJson } from "@/learn/mobile/http";
import { registerStudentByInvite } from "@/learn/mobile/register";
import { rateLimit } from "@/learn/rate-limit";

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limited = rateLimit(`mobile-register:${ip}`, 10, 60_000);
  if (!limited.ok) {
    return apiError(429, "rate_limited", "Слишком много попыток. Подождите минуту.");
  }

  const body = await readJson<{
    inviteToken?: string;
    name?: string;
    email?: string;
    password?: string;
    consent?: boolean | string;
  }>(request);
  if (!body.ok) return body.response;

  const consentRaw = body.data.consent;
  const consent = consentRaw === true || consentRaw === "yes" || consentRaw === "true" || consentRaw === "1";

  const result = await registerStudentByInvite({
    inviteToken: String(body.data.inviteToken ?? ""),
    name: String(body.data.name ?? ""),
    email: String(body.data.email ?? ""),
    password: String(body.data.password ?? ""),
    consent: Boolean(consent),
  });

  if (!result.ok) {
    return apiError(result.status, result.code, result.message);
  }
  return apiOk({ ok: true, message: result.message, email: result.email }, 201);
}
