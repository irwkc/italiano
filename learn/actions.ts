"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getTeacherSession,
  loginTeacher,
  logoutStudent,
  logoutTeacher,
} from "@/learn/auth";
import { mutateStore, readStore } from "@/learn/data/store";
import { addHour } from "@/learn/format";
import { appendLive, emptyLive, removeActivityRefs } from "@/learn/live";
import type { Activity, Store } from "@/learn/types";

export async function loginTeacherAction(_prev: { error: string } | null, formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const password = String(formData.get("password") ?? "");
  const ok = await loginTeacher(name, password);
  if (!ok) {
    return { error: process.env.AULA_PASSWORD ? "Имя или пароль не подошли." : "Задайте AULA_PASSWORD в .env.local." };
  }
  redirect("/aula/insegnante");
}

export async function logoutTeacherAction() {
  await logoutTeacher();
  redirect("/aula/login");
}

export async function logoutStudentAction() {
  await logoutStudent();
  redirect("/aula");
}

async function requireTeacher() {
  const teacher = await getTeacherSession();
  if (!teacher) redirect("/aula/login");
  return teacher;
}

function revalidateStudent(token: string) {
  revalidatePath(`/aula/s/${token}`);
  revalidatePath(`/aula/s/${token}/orario`);
  revalidatePath(`/aula/s/${token}/compiti`);
}

async function bumpTeacher(studentId?: string) {
  revalidatePath("/aula/insegnante");
  revalidatePath("/aula/insegnante/schede");
  revalidatePath("/aula/insegnante/studenti");
  revalidatePath("/aula/insegnante/orario");
  const store = await readStore();
  if (studentId) {
    revalidatePath(`/aula/insegnante/${studentId}/live`);
    const student = store.students.find((s) => s.id === studentId);
    if (student) revalidateStudent(student.token);
    return;
  }
  for (const student of store.students) revalidateStudent(student.token);
}

function studentToken(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "")
    .slice(0, 12) || "s";
  return `${slug}.${crypto.randomUUID().replace(/-/g, "").slice(0, 22)}`;
}

export async function addStudentAction(formData: FormData) {
  await requireTeacher();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  let created = "";
  const store = await mutateStore((draft) => {
    const id = `st-${crypto.randomUUID()}`;
    created = id;
    draft.students.push({
      id,
      teacherId: draft.teacher.id,
      name,
      token: studentToken(name),
    });
  });
  const student = store.students.find((s) => s.id === created);
  await bumpTeacher(created);
  redirect(`/aula/insegnante/studenti?alunno=${student?.id ?? created}`);
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
  let token = "";
  await mutateStore((store) => {
    const student = store.students.find((s) => s.id === studentId);
    if (!student) return;
    token = student.token;
    const lessonIds = new Set(store.lessons.filter((lesson) => lesson.studentId === studentId).map((lesson) => lesson.id));
    store.assignments = store.assignments.filter((item) => !lessonIds.has(item.lessonId));
    store.lessons = store.lessons.filter((lesson) => lesson.studentId !== studentId);
    store.live = store.live.filter((live) => live.studentId !== studentId);
    if (store.liveStudentId === studentId) store.liveStudentId = null;
    store.students = store.students.filter((item) => item.id !== studentId);
  });
  if (token) revalidateStudent(token);
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
  const times = timesFromForm(formData);
  if (!studentId || !times) return;
  await mutateStore((store) => {
    store.lessons.push({
      id: `l-${crypto.randomUUID()}`,
      studentId,
      title: "Lezione",
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

function nextLessonFor(store: Store, studentId: string, startsAtMin: number) {
  return store.lessons
    .filter((l) => l.studentId === studentId && new Date(l.startsAt).getTime() >= startsAtMin)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null;
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
  if (!studentId || !activityId) return { error: "Выберите ученика." };
  const next = nextLessonFor(await readStore(), studentId, Date.now());
  if (!next) return { error: "Нет ближайшего урока. Поставьте занятие в календаре." };
  await mutateStore((store) => {
    const exists = store.assignments.some((a) => a.lessonId === next.id && a.activityId === activityId);
    if (exists) return;
    store.assignments.push({
      id: `as-${crypto.randomUUID()}`,
      lessonId: next.id,
      activityId,
      kind: "homework",
    });
  });
  await bumpTeacher(studentId);
  return { ok: `На дом к «${next.title}»` };
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

export async function renameTopicAction(formData: FormData) {
  await requireTeacher();
  const from = String(formData.get("from") ?? "").trim();
  const to = String(formData.get("to") ?? "").trim();
  if (!from || !to || from === to) return;
  await mutateStore((store) => {
    if (store.topics.includes(to)) return;
    store.topics = store.topics.map((topic) => (topic === from ? to : topic));
    for (const activity of store.activities) {
      if (activity.topic === from) activity.topic = to;
    }
  });
  await bumpTeacher();
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

export async function createActivityAction(formData: FormData): Promise<{ error?: string; id?: string }> {
  await requireTeacher();
  const type = String(formData.get("type") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const prompt = String(formData.get("prompt") ?? "").trim();
  if (!topic || !title) return { error: "Нужны раздел и название." };
  const id = `act-${crypto.randomUUID()}`;
  let activity: Activity | null = null;
  if (type === "quiz") {
    const options = String(formData.get("options") ?? "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const answer = Number(formData.get("answer") ?? 0);
    if (options.length < 2) return { error: "Нужны хотя бы два варианта." };
    if (!prompt) return { error: "Нужен вопрос." };
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) return { error: "Отметьте верный вариант." };
    activity = { id, type: "quiz", title, topic, prompt, options, answer };
  } else if (type === "cloze") {
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
    activity = { id, type: "cloze", title, topic, prompt: prompt || undefined, text, answers, bank: words };
  } else {
    return { error: "Выберите тип." };
  }
  const created = activity;
  await mutateStore((store) => {
    if (!store.topics.includes(topic)) store.topics.push(topic);
    const last = store.activities.findLastIndex((item) => item.topic === topic);
    if (last === -1) store.activities.push(created);
    else store.activities.splice(last + 1, 0, created);
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

