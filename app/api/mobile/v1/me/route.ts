import { requireMobileStudent } from "@/learn/mobile/auth";
import { apiOk } from "@/learn/mobile/http";
import { profileDto } from "@/learn/mobile/serialize";

export async function GET(request: Request) {
  const auth = await requireMobileStudent(request);
  if (!auth.ok) return auth.response;
  return apiOk(profileDto(auth.student));
}
