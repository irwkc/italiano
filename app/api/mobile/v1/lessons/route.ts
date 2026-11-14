import { requireMobileStudent } from "@/learn/mobile/auth";
import { apiOk } from "@/learn/mobile/http";
import { lessonDto } from "@/learn/mobile/serialize";

export async function GET(request: Request) {
  const auth = await requireMobileStudent(request);
  if (!auth.ok) return auth.response;
  const lessons = auth.store.lessons
    .filter((l) => l.studentId === auth.student.id)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map(lessonDto);
  return apiOk({ lessons, meetUrl: auth.store.meetUrl || null });
}
