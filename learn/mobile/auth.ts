import { bearerToken, apiError } from "@/learn/mobile/http";
import { resolveMobileStudent } from "@/learn/mobile/tokens";

export async function requireMobileStudent(request: Request) {
  const token = bearerToken(request);
  const resolved = await resolveMobileStudent(token);
  if (!resolved) {
    return {
      ok: false as const,
      response: apiError(401, "unauthorized", "Нужен вход."),
    };
  }
  return { ok: true as const, ...resolved };
}
