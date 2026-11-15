"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getTeacherSession,
  loginStudentSession,
  loginTeacher,
  logoutStudent,
  logoutTeacher,
} from "@/learn/auth";
import { readActivityChapter, readActivityLevel } from "@/learn/cefr";
import { hashToken, randomToken, verifyPassword } from "@/learn/crypto";
import { mutateStore, readStore } from "@/learn/data/store";
import { addHour } from "@/learn/format";
import { appendLive, emptyLive, removeActivityRefs } from "@/learn/live";
import { appUrl } from "@/learn/mail";
import { rateLimit } from "@/learn/rate-limit";
import type { Activity, Store } from "@/learn/types";
import { isBoardCorrect } from "@/learn/boards/score";

const INVITE_DAYS = 7;

export async function loginTeacherAction(_prev: { error: string } | null, formData: FormData) {
  const ip = "login-teacher";
  const limited = rateLimit(ip, 20, 60_000);
  if (!limited.ok) return { error: "Слишком много попыток. Подождите минуту." };
  const name = String(formData.get("name") ?? "");
  const password = String(formData.get("password") ?? "");
  const ok = await loginTeacher(name, password);
  if (!ok) {
    return { error: process.env.AULA_PASSWORD ? "Имя или пароль не подошли." : "Задайте AULA_PASSWORD в .env.local." };
  }
  redirect("/aula/insegnante");
}

export async function loginStudentAction(_prev: { error: string } | null, formData: FormData) {
  const limited = rateLimit("login-student", 20, 60_000);
  if (!limited.ok) return { error: "Слишком много попыток. Подождите минуту." };
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Укажите email и пароль." };
  const store = await readStore();
  const student = store.students.find((s) => s.email === email);
  if (!student || !student.passwordHash || !verifyPassword(password, student.passwordHash)) {
    return { error: "Email или пароль не подошли." };
  }
  if (!student.emailVerifiedAt) {
    return { error: "Сначала подтвердите email — ссылка в письме." };
  }
  await loginStudentSession(student);
  redirect("/aula/me");
}

export async function logoutTeacherAction() {
  await logoutTeacher();
  redirect("/aula/login");
}

export async function logoutStudentAction() {
  await logoutStudent();
  redirect("/aula/login");
}

async function requireTeacher() {
  const teacher = await getTeacherSession();
  if (!teacher) redirect("/aula/login");
  return teacher;
}

function revalidateMe() {
  revalidatePath("/aula/me");
  revalidatePath("/aula/me/orario");
  revalidatePath("/aula/me/compiti");
}

async function bumpTeacher(studentId?: string) {
  revalidatePath("/aula/insegnante");
  revalidatePath("/aula/insegnante/schede");
  revalidatePath("/aula/insegnante/studenti");
  revalidatePath("/aula/insegnante/orario");
  revalidateMe();
  if (studentId) {
    revalidatePath(`/aula/insegnante/${studentId}/live`);
  }
}

export async function createInviteAction(): Promise<{ error?: string; url?: string; expiresAt?: string }> {
  await requireTeacher();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await mutateStore((draft) => {
    draft.invites.push({
      id: `inv-${crypto.randomUUID()}`,
      tokenHash: hashToken(token),
      expiresAt,
      usedAt: null,
      createdAt: new Date().toISOString(),
    });
  });
  await bumpTeacher();
  return { url: `${appUrl()}/aula/invite/${token}`, expiresAt };
}

export async function registerInviteAction(
  _prev: { error?: string; ok?: string } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: string }> {
  const { registerStudentByInvite } = await import("@/learn/mobile/register");
  const result = await registerStudentByInvite({
    inviteToken: String(formData.get("inviteToken") ?? ""),
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    consent: String(formData.get("consent") ?? "") === "yes",
  });
  revalidatePath("/aula/insegnante/studenti");
  if (!result.ok) return { error: result.message };
  return { ok: result.message };
}

export async function updateStudentAction(formData: FormData) {
  await requireTeacher();
  const studentId = String(formData.get("studentId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!studentId || !name) return;
  await mutateStore((store) => {
    const student = store.students.find((s) => s.id === studentId);
    if (student) student.name = name;
  });
  await bumpTeacher(studentId);
}

export async function deleteStudentAction(formData: FormData) {
  await requireTeacher();
  const studentId = String(formData.get("studentId") ?? "");
  if (!studentId) return;
  await mutateStore((store) => {
    const student = store.students.find((s) => s.id === studentId);
    if (!student) return;
    const lessonIds = new Set(store.lessons.filter((lesson) => lesson.studentId === studentId).map((lesson) => lesson.id));
    store.assignments = store.assignments.filter((item) => !lessonIds.has(item.lessonId));
    store.lessons = store.lessons.filter((lesson) => lesson.studentId !== studentId);
    store.live = store.live.filter((live) => live.studentId !== studentId);
    store.emailTokens = store.emailTokens.filter((item) => item.studentId !== studentId);
    if (store.liveStudentId === studentId) store.liveStudentId = null;
    store.students = store.students.filter((item) => item.id !== studentId);
  });
  revalidatePath(`/aula/insegnante/${studentId}`);
  revalidatePath(`/aula/insegnante/${studentId}/live`);
  await bumpTeacher();
}

export async function setMeetUrlAction(formData: FormData) {
  await requireTeacher();
  const url = String(formData.get("meetUrl") ?? "").trim();
  await mutateStore((store) => {
    store.meetUrl = url;
  });
  await bumpTeacher();
}

function timesFromForm(formData: FormData) {
  const day = String(formData.get("day") ?? "");
  const startTime = String(formData.get("startTime") ?? "16:00");
  const endTime = String(formData.get("endTime") ?? "");
  const start = new Date(`${day}T${startTime}`);
  if (!day || Number.isNaN(start.getTime())) return null;
  let end = new Date(`${day}T${endTime || addHour(startTime)}`);
  if (Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }
  return { start, end };
}

export async function createLessonAction(formData: FormData) {
  await requireTeacher();
  const studentId = String(formData.get("studentId") ?? "");
  const title = String(formData.get("title") ?? "").trim() || "Lezione";
  const times = timesFromForm(formData);
  if (!studentId || !times) return;
  await mutateStore((store) => {
    store.lessons.push({
      id: `l-${crypto.randomUUID()}`,
      studentId,
      title,
      startsAt: times.start.toISOString(),
      endsAt: times.end.toISOString(),
    });
  });
  await bumpTeacher(studentId);
}

export async function moveLessonAction(formData: FormData) {
  await requireTeacher();
  const lessonId = String(formData.get("lessonId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const times = timesFromForm(formData);
  if (!times) return;
  await mutateStore((store) => {
    const lesson = store.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    lesson.startsAt = times.start.toISOString();
    lesson.endsAt = times.end.toISOString();
    if (title) lesson.title = title;
  });
  await bumpTeacher(studentId);
}

export async function deleteLessonAction(formData: FormData) {
  await requireTeacher();
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!lessonId) return;
  let studentId = "";
  await mutateStore((store) => {
    const lesson = store.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    studentId = lesson.studentId;
    store.assignments = store.assignments.filter((a) => a.lessonId !== lessonId);
    store.lessons = store.lessons.filter((l) => l.id !== lessonId);
  });
  await bumpTeacher(studentId || undefined);
}

function nextLessonFor(store: Store, studentId: string, startsAtMin: number) {
  return (
    store.lessons
      .filter((l) => l.studentId === studentId && new Date(l.startsAt).getTime() >= startsAtMin)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null
  );
}

function ensureLive(store: Store, studentId: string) {
  let live = store.live.find((l) => l.studentId === studentId);
  if (!live) {
    live = emptyLive(studentId);
    store.live.push(live);
  }
  store.liveStudentId = studentId;
  return live;
}

export async function focusLiveAction(formData: FormData) {
  await requireTeacher();
  const studentId = String(formData.get("studentId") ?? "");
  await mutateStore((store) => {
    if (!studentId) {
      store.liveStudentId = null;
      return;
    }
    ensureLive(store, studentId);
  });
  await bumpTeacher(studentId || undefined);
}

export async function assignHomeworkAction(formData: FormData): Promise<{ error?: string; ok?: string }> {
  await requireTeacher();
  const studentId = String(formData.get("studentId") ?? "");
  const activityId = String(formData.get("activityId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!studentId || !activityId) return { error: "Выберите ученика." };
  const store = await readStore();
  const lesson =
    (lessonId ? store.lessons.find((l) => l.id === lessonId && l.studentId === studentId) : null) ??
    nextLessonFor(store, studentId, Date.now());
  if (!lesson) return { error: "Нет ближайшего урока. Поставьте занятие в календаре." };
  let duplicate = false;
  await mutateStore((draft) => {
    const exists = draft.assignments.some((a) => a.lessonId === lesson.id && a.activityId === activityId);
    if (exists) {
      duplicate = true;
      return;
    }
    draft.assignments.push({
      id: `as-${crypto.randomUUID()}`,
      lessonId: lesson.id,
      activityId,
      kind: "homework",
    });
  });
  await bumpTeacher(studentId);
  if (duplicate) return { error: "Это задание уже повешено на этот урок." };
  return { ok: `На дом к «${lesson.title}»` };
}

export async function openLiveAction(formData: FormData): Promise<{ error?: string; ok?: string }> {
  await requireTeacher();
  const studentId = String(formData.get("studentId") ?? "");
  const activityId = String(formData.get("activityId") ?? "");
  if (!studentId || !activityId) return { error: "Выберите ученика." };
  const out = { status: "added" as ReturnType<typeof appendLive>, count: 0 };
  await mutateStore((store) => {
    const live = ensureLive(store, studentId);
    out.status = appendLive(live, activityId);
    live.rev += 1;
    out.count = live.queue.length;
  });
  await bumpTeacher(studentId);
  if (out.status === "already") return { ok: "Уже в очереди live" };
  return { ok: `В live · ${out.count}` };
}

function lines(raw: string) {
  return raw
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function addTopicAction(formData: FormData) {
  await requireTeacher();
  const topic = String(formData.get("topic") ?? "").trim();
  if (!topic) return;
  await mutateStore((store) => {
    if (!store.topics.includes(topic)) store.topics.push(topic);
  });
  await bumpTeacher();
}

export async function renameTopicAction(formData: FormData): Promise<{ error?: string }> {
  await requireTeacher();
  const from = String(formData.get("from") ?? "").trim();
  const to = String(formData.get("to") ?? "").trim();
  if (!from || !to || from === to) return {};
  let clash = false;
  await mutateStore((store) => {
    if (store.topics.includes(to)) {
      clash = true;
      return;
    }
    store.topics = store.topics.map((topic) => (topic === from ? to : topic));
    for (const activity of store.activities) {
      if (activity.topic === from) activity.topic = to;
    }
  });
  await bumpTeacher();
  if (clash) return { error: "Такой раздел уже есть." };
  return {};
}

export async function deleteTopicAction(formData: FormData) {
  await requireTeacher();
  const topic = String(formData.get("topic") ?? "").trim();
  if (!topic) return;
  await mutateStore((store) => {
    const gone = store.activities.filter((activity) => activity.topic === topic).map((activity) => activity.id);
    for (const id of gone) removeActivityRefs(store, id);
    store.activities = store.activities.filter((activity) => activity.topic !== topic);
    store.topics = store.topics.filter((item) => item !== topic);
  });
  await bumpTeacher();
}

function parseActivityForm(formData: FormData, id: string): { error?: string; activity?: Activity } {
  const type = String(formData.get("type") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (!topic || !title) return { error: "Нужны раздел и название." };
  if (type === "quiz") {
    const options = String(formData.get("options") ?? "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const answer = Number(formData.get("answer") ?? 0);
    if (options.length < 2) return { error: "Нужны хотя бы два варианта." };
    if (!prompt) return { error: "Нужен вопрос." };
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) return { error: "Отметьте верный вариант." };
    return attachPlacement({ id, type: "quiz", title, topic, prompt, options, answer }, formData);
  }
  if (type === "cloze") {
    const text = String(formData.get("text") ?? "").trim();
    const answers = lines(String(formData.get("answers") ?? ""));
    const bank = lines(String(formData.get("bank") ?? ""));
    const gaps = text.split("____").length - 1;
    if (gaps < 1) return { error: "В тексте нужны пропуски ____." };
    if (answers.length !== gaps) return { error: "Число ответов должно совпасть с пропусками." };
    const words = [...bank];
    for (const word of answers) {
      if (!words.includes(word)) words.push(word);
    }
    return attachPlacement(
      { id, type: "cloze", title, topic, prompt: prompt || undefined, text, answers, bank: words },
      formData,
    );
  }
  return { error: "Выберите тип." };
}

function attachPlacement(activity: Activity, formData: FormData): { error?: string; activity?: Activity } {
  const levelRead = readActivityLevel(formData.get("level"));
  if (levelRead.error) return { error: levelRead.error };
  const chapterRead = readActivityChapter(formData.get("chapterNumber"), formData.get("chapterTitle"));
  if (chapterRead.error) return { error: chapterRead.error };
  if (levelRead.level) activity.level = levelRead.level;
  if (chapterRead.chapter) activity.chapter = chapterRead.chapter;
  return { activity };
}

export async function createActivityAction(formData: FormData): Promise<{ error?: string; id?: string }> {
  await requireTeacher();
  const id = `act-${crypto.randomUUID()}`;
  const parsed = parseActivityForm(formData, id);
  if (parsed.error || !parsed.activity) return { error: parsed.error ?? "Ошибка." };
  const created = parsed.activity;
  const topic = created.topic;
  await mutateStore((store) => {
    if (!store.topics.includes(topic)) store.topics.push(topic);
    const last = store.activities.findLastIndex((item) => item.topic === topic);
    if (last === -1) store.activities.push(created);
    else store.activities.splice(last + 1, 0, created);
  });
  await bumpTeacher();
  return { id };
}

export async function updateActivityAction(formData: FormData): Promise<{ error?: string; id?: string }> {
  await requireTeacher();
  const id = String(formData.get("activityId") ?? "");
  if (!id) return { error: "Нет задания." };
  const parsed = parseActivityForm(formData, id);
  if (parsed.error || !parsed.activity) return { error: parsed.error ?? "Ошибка." };
  const next = parsed.activity;
  await mutateStore((store) => {
    const index = store.activities.findIndex((item) => item.id === id);
    if (index === -1) return;
    const previous = store.activities[index];
    if (previous.image && !next.image) next.image = previous.image;
    if (!store.topics.includes(next.topic)) store.topics.push(next.topic);
    store.activities[index] = next;
  });
  await bumpTeacher();
  return { id };
}

export async function reorderActivitiesAction(topic: string, orderedIds: string[]) {
  await requireTeacher();
  const ids = orderedIds.filter(Boolean);
  if (!topic || ids.length === 0) return;
  await mutateStore((store) => {
    const byId = new Map(store.activities.map((activity) => [activity.id, activity]));
    const moved = ids.map((id) => byId.get(id)).filter((activity): activity is Activity => Boolean(activity));
    if (moved.length === 0) return;
    for (const activity of moved) activity.topic = topic;
    const used = new Set(moved.map((activity) => activity.id));
    const leftover = store.activities.filter((activity) => !used.has(activity.id));
    const next: Activity[] = [];
    let placed = false;
    for (const name of store.topics) {
      if (name === topic) {
        next.push(...moved);
        placed = true;
        continue;
      }
      next.push(...leftover.filter((activity) => activity.topic === name));
    }
    if (!placed) next.push(...moved);
    next.push(...leftover.filter((activity) => !store.topics.includes(activity.topic)));
    store.activities = next;
  });
  await bumpTeacher();
}

export async function deleteActivityAction(formData: FormData) {
  await requireTeacher();
  const activityId = String(formData.get("activityId") ?? "");
  if (!activityId) return;
  await mutateStore((store) => {
    removeActivityRefs(store, activityId);
    store.activities = store.activities.filter((activity) => activity.id !== activityId);
  });
  await bumpTeacher();
}

export async function saveAssignmentProgressAction(formData: FormData): Promise<{ error?: string; ok?: boolean; correct?: boolean }> {
  const { getStudentSession } = await import("@/learn/auth");
  const student = await getStudentSession();
  if (!student) return { error: "Войдите в кабинет." };
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const checked = String(formData.get("checked") ?? "") === "1";
  let picks: Record<string, string | null> = {};
  try {
    picks = JSON.parse(String(formData.get("picks") ?? "{}")) as Record<string, string | null>;
  } catch {
    return { error: "Некорректные ответы." };
  }
  let correct = false;
  let error: string | undefined;
  await mutateStore((store) => {
    const assignment = store.assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      error = "Задание не найдено.";
      return;
    }
    const lesson = store.lessons.find((l) => l.id === assignment.lessonId);
    if (!lesson || lesson.studentId !== student.id) {
      error = "Нет доступа.";
      return;
    }
    const activity = store.activities.find((a) => a.id === assignment.activityId);
    if (!activity) {
      error = "Материал удалён.";
      return;
    }
    if (checked) {
      const answered =
        activity.type === "quiz"
          ? Boolean(picks[activity.id])
          : activity.answers.every((_, i) => Boolean(picks[String(i)]));
      if (!answered) {
        error = "Сначала выберите ответ.";
        return;
      }
      correct = isBoardCorrect(activity, picks);
    }
    assignment.progress = {
      picks,
      checked,
      correct: checked ? correct : false,
      updatedAt: new Date().toISOString(),
    };
  });
  revalidateMe();
  revalidatePath("/aula/insegnante/studenti");
  if (error) return { error };
  return { ok: true, correct };
}
