import { publicActivity } from "@/learn/activity-public";
import { emptyLive, normalizeLive } from "@/learn/live";
import { appUrl } from "@/learn/mail";
import type { Activity, Assignment, Lesson, LiveSession, Store, Student } from "@/learn/types";
import { studentProfile } from "@/learn/mobile/tokens";

export function absoluteMediaUrl(path: string | undefined | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = appUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function publicActivityMobile(activity: Activity) {
  const stripped = publicActivity(activity);
  const image = absoluteMediaUrl(stripped.image);
  if (stripped.type === "quiz") {
    return {
      id: stripped.id,
      type: "quiz" as const,
      title: stripped.title,
      topic: stripped.topic,
      prompt: stripped.prompt,
      options: stripped.options,
      image,
    };
  }
  return {
    id: stripped.id,
    type: "cloze" as const,
    title: stripped.title,
    topic: stripped.topic,
    prompt: stripped.prompt ?? null,
    text: stripped.text,
    bank: stripped.bank,
    image,
  };
}

export function lessonDto(lesson: Lesson) {
  return {
    id: lesson.id,
    title: lesson.title,
    startsAt: lesson.startsAt,
    endsAt: lesson.endsAt ?? null,
  };
}

export function homeworkItemDto(assignment: Assignment, activity: Activity | undefined) {
  return {
    id: assignment.id,
    lessonId: assignment.lessonId,
    kind: assignment.kind,
    activity: activity ? publicActivityMobile(activity) : null,
    progress: assignment.progress
      ? {
          picks: assignment.progress.picks,
          checked: assignment.progress.checked,
          correct: assignment.progress.correct,
          updatedAt: assignment.progress.updatedAt,
        }
      : null,
  };
}

export function liveStateDto(store: Store, studentId: string, opts?: { done?: boolean }) {
  const live = store.live.find((l) => l.studentId === studentId) ?? emptyLive(studentId);
  normalizeLive(live);
  const activity = live.activityId ? store.activities.find((a) => a.id === live.activityId) : undefined;
  const queue = live.queue.map((id) => ({
    id,
    title: store.activities.find((a) => a.id === id)?.title ?? id,
  }));
  const atEnd = live.queue.length === 0 || live.index >= live.queue.length - 1;
  return {
    studentId: live.studentId,
    activityId: live.activityId,
    queue,
    index: live.index,
    picks: live.picks,
    selected: live.selected,
    checked: live.checked,
    rev: live.rev,
    activity: activity ? publicActivityMobile(activity) : null,
    meetUrl: store.meetUrl || null,
    done: opts?.done ?? (live.queue.length === 0 && live.index === 0),
    hasNext: live.queue.length > 0 && live.index + 1 < live.queue.length,
    atEnd,
  };
}

export function profileDto(student: Student) {
  return studentProfile(student);
}

export type LiveMutateBody = {
  picks?: Record<string, string | null>;
  selected?: string | null;
  checked?: boolean;
  rev?: number;
};

export function applyStudentLivePatch(live: LiveSession, body: LiveMutateBody) {
  if ("picks" in body && body.picks) live.picks = body.picks;
  if ("selected" in body) live.selected = body.selected ?? null;
  if ("checked" in body) live.checked = Boolean(body.checked);
  live.rev += 1;
}

/** Same default-lesson heuristic as `/aula/me/compiti`. */
export function defaultHomeworkLessonId(
  lessons: { id: string; startsAt: string }[],
  assignmentLessonIds: Set<string>,
) {
  const now = Date.now();
  const withHw = lessons.filter((l) => assignmentLessonIds.has(l.id));
  const upcomingHw = withHw.find((l) => new Date(l.startsAt).getTime() >= now);
  if (upcomingHw) return upcomingHw.id;
  const upcoming = lessons.find((l) => new Date(l.startsAt).getTime() >= now);
  if (upcoming) return upcoming.id;
  if (withHw.length) return withHw[withHw.length - 1].id;
  return lessons[lessons.length - 1]?.id;
}
