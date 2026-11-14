import { apiOk, bearerToken, readJson } from "@/learn/mobile/http";
import { resolveMobileStudent, revokeMobileSession } from "@/learn/mobile/tokens";

export async function POST(request: Request) {
  let refreshToken: string | null = null;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await readJson<{ refreshToken?: string }>(request);
    if (body.ok) refreshToken = String(body.data.refreshToken ?? "").trim() || null;
  }

  const access = bearerToken(request);
  const resolved = access ? await resolveMobileStudent(access) : null;

  await revokeMobileSession({
    refreshToken,
    sessionId: resolved?.session.id ?? null,
  });

  return apiOk({ ok: true });
}
