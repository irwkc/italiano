import { apiOk } from "@/learn/mobile/http";

export async function GET() {
  return apiOk({ ok: true, version: "v1" });
}
