import { isBoardCorrect } from "@/learn/boards/score";
import { mutateStore } from "@/learn/data/store";
import { requireMobileStudent } from "@/learn/mobile/auth";
import { apiError, apiOk, readJson } from "@/learn/mobile/http";

export async function PUT(
  request: Request,
  context: { params: Promise<{ assignmentId: string }> },
) {
  const auth = await requireMobileStudent(request);
  if (!auth.ok) return auth.response;
  const { assignmentId } = await context.params;
  if (!assignmentId) {
    return apiError(400, "validation_error", "Нужен assignmentId.");
  }

  const body = await readJson<{ picks?: Record<string, string | null>; checked?: boolean }>(request);
  if (!body.ok) return body.response;
  const picks = body.data.picks;
  if (!picks || typeof picks !== "object" || Array.isArray(picks)) {
    return apiError(400, "validation_error", "Нужен объект picks.");
  }
  const checked = Boolean(body.data.checked);

  let correct = false;
  const fail: { status: number; code: "not_found" | "forbidden" | "validation_error"; message: string } = {
    status: 0,
    code: "not_found",
    message: "",
  };
  let failed = false;
  let progress: {
    picks: Record<string, string | null>;
    checked: boolean;
    correct: boolean;
    updatedAt: string;
  } | null = null;

  await mutateStore((store) => {
    const assignment = store.assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      failed = true;
      fail.status = 404;
      fail.code = "not_found";
      fail.message = "Задание не найдено.";
      return;
    }
    const lesson = store.lessons.find((l) => l.id === assignment.lessonId);
    if (!lesson || lesson.studentId !== auth.student.id) {
      failed = true;
      fail.status = 403;
      fail.code = "forbidden";
      fail.message = "Нет доступа.";
      return;
    }
    const activity = store.activities.find((a) => a.id === assignment.activityId);
    if (!activity) {
      failed = true;
      fail.status = 404;
      fail.code = "not_found";
      fail.message = "Материал удалён.";
      return;
    }
    if (checked) {
      const answered =
        activity.type === "quiz"
          ? Boolean(picks[activity.id])
          : activity.answers.every((_, i) => Boolean(picks[String(i)]));
      if (!answered) {
        failed = true;
        fail.status = 400;
        fail.code = "validation_error";
        fail.message = "Сначала выберите ответ.";
        return;
      }
      correct = isBoardCorrect(activity, picks);
    }
    progress = {
      picks,
      checked,
      correct: checked ? correct : false,
      updatedAt: new Date().toISOString(),
    };
    assignment.progress = progress;
  });

  if (failed) return apiError(fail.status, fail.code, fail.message);
  return apiOk({ ok: true, correct: checked ? correct : false, progress });
}
