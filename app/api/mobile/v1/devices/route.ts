import { mutateStore } from "@/learn/data/store";
import { requireMobileStudent } from "@/learn/mobile/auth";
import { apiError, apiOk, readJson } from "@/learn/mobile/http";
import type { DeviceToken } from "@/learn/types";

function deviceDto(device: DeviceToken) {
  return {
    id: device.id,
    platform: device.platform,
    apnsToken: device.apnsToken,
    updatedAt: device.updatedAt,
  };
}

export async function POST(request: Request) {
  const auth = await requireMobileStudent(request);
  if (!auth.ok) return auth.response;

  const body = await readJson<{ platform?: string; apnsToken?: string; appVersion?: string }>(request);
  if (!body.ok) return body.response;

  const platform = String(body.data.platform ?? "").trim().toLowerCase();
  const apnsToken = String(body.data.apnsToken ?? "").trim();
  const appVersion = String(body.data.appVersion ?? "").trim() || undefined;

  if (platform !== "ios") {
    return apiError(400, "validation_error", "Поддерживается platform: ios.");
  }
  if (!apnsToken || apnsToken.length < 8 || apnsToken.length > 4096) {
    return apiError(400, "validation_error", "Нужен apnsToken.");
  }

  let device: DeviceToken | null = null;
  await mutateStore((draft) => {
    const now = new Date().toISOString();
    const existing = draft.deviceTokens.find((row) => row.apnsToken === apnsToken);
    if (existing) {
      existing.studentId = auth.student.id;
      existing.platform = "ios";
      existing.appVersion = appVersion;
      existing.updatedAt = now;
      device = existing;
      return;
    }
    device = {
      id: `dev-${crypto.randomUUID()}`,
      studentId: auth.student.id,
      platform: "ios",
      apnsToken,
      appVersion,
      createdAt: now,
      updatedAt: now,
    };
    draft.deviceTokens.push(device);
  });

  return apiOk({ device: deviceDto(device!) });
}

export async function DELETE(request: Request) {
  const auth = await requireMobileStudent(request);
  if (!auth.ok) return auth.response;

  const body = await readJson<{ apnsToken?: string; deviceId?: string }>(request);
  if (!body.ok) return body.response;

  const apnsToken = String(body.data.apnsToken ?? "").trim();
  const deviceId = String(body.data.deviceId ?? "").trim();
  if (!apnsToken && !deviceId) {
    return apiError(400, "validation_error", "Укажите apnsToken или deviceId.");
  }

  await mutateStore((draft) => {
    draft.deviceTokens = draft.deviceTokens.filter((row) => {
      if (row.studentId !== auth.student.id) return true;
      if (deviceId && row.id === deviceId) return false;
      if (apnsToken && row.apnsToken === apnsToken) return false;
      return true;
    });
  });

  return apiOk({ ok: true });
}
