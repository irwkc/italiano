import { NextRequest } from "next/server";

export type ErrorCode =
  | "validation_error"
  | "unauthorized"
  | "invalid_credentials"
  | "email_unverified"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "server_error";

export function apiError(status: number, code: ErrorCode, message: string, extra?: Record<string, unknown>) {
  return Response.json({ error: { code, message }, ...extra }, { status });
}

export function apiOk(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export async function readJson<T>(request: Request): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  try {
    const data = (await request.json()) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: apiError(400, "validation_error", "Ожидался JSON."),
    };
  }
}

export function clientIp(request: NextRequest | Request) {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}

export function bearerToken(request: Request) {
  const raw = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return match?.[1]?.trim() || null;
}
