import { requireMobileStudent } from "@/learn/mobile/auth";
import { apiOk } from "@/learn/mobile/http";
import { defaultHomeworkLessonId, homeworkItemDto, lessonDto } from "@/learn/mobile/serialize";

export async function GET(request: Request) {
  const auth = await requireMobileStudent(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const lessonParam = url.searchParams.get("lessonId");

  const lessons = auth.store.lessons
    .filter((l) => l.studentId === auth.student.id)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const myLessonIds = new Set(lessons.map((l) => l.id));
  const homework = auth.store.assignments.filter(
    (a) => a.kind === "homework" && myLessonIds.has(a.lessonId),
  );

  if (scope === "all") {
    return apiOk({
      lessonId: null,
      lessons: lessons.map(lessonDto),
      items: homework.map((a) =>
        homeworkItemDto(
          a,
          auth.store.activities.find((act) => act.id === a.activityId),
        ),
      ),
    });
  }

  const homeworkLessonIds = new Set(homework.map((a) => a.lessonId));
  const lessonId =
    lessonParam && lessons.some((l) => l.id === lessonParam)
      ? lessonParam
      : defaultHomeworkLessonId(lessons, homeworkLessonIds);

  const items = homework
    .filter((a) => a.lessonId === lessonId)
    .map((a) =>
      homeworkItemDto(
        a,
        auth.store.activities.find((act) => act.id === a.activityId),
      ),
    );

  return apiOk({
    lessonId: lessonId ?? null,
    lessons: lessons.map(lessonDto),
    items,
  });
}
