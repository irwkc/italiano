import { NextRequest } from "next/server";
import { apiError, apiOk, readJson } from "@/learn/mobile/http";
import { rotateMobileSession } from "@/learn/mobile/tokens";

export async function POST(request: NextRequest) {
  const body = await readJson<{ refreshToken?: string }>(request);
  if (!body.ok) return body.response;
  const refreshToken = String(body.data.refreshToken ?? "").trim();
  if (!refreshToken) {
    return apiError(400, "validation_error", "Нужен refreshToken.");
  }
  const tokens = await rotateMobileSession(refreshToken, request.headers.get("user-agent") ?? undefined);
  if (!tokens) {
    return apiError(401, "unauthorized", "Сессия недействительна. Войдите снова.");
  }
  return apiOk(tokens);
}
