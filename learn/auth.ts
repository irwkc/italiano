import { cookies } from "next/headers";
import { readStore } from "@/learn/data/store";
import type { Student, Teacher } from "@/learn/types";

export const TEACHER_COOKIE = "aula_teacher";
export const STUDENT_COOKIE = "aula_student";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/aula",
  secure: process.env.NODE_ENV === "production",
};

export async function loginTeacher(name: string, password: string): Promise<boolean> {
  const store = readStore();
  const expected = process.env.AULA_PASSWORD;
  if (!expected) return false;
  if (name.trim().toLowerCase() !== store.teacher.name.toLowerCase()) return false;
  if (password !== expected) return false;
  const jar = await cookies();
  jar.set(TEACHER_COOKIE, store.teacher.id, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

export async function logoutTeacher() {
  const jar = await cookies();
  jar.set(TEACHER_COOKIE, "", { ...cookieBase, maxAge: 0 });
}

export async function logoutStudent() {
  const jar = await cookies();
  jar.set(STUDENT_COOKIE, "", { ...cookieBase, maxAge: 0 });
}

export async function getTeacherSession(): Promise<Teacher | null> {
  const jar = await cookies();
  const id = jar.get(TEACHER_COOKIE)?.value;
  if (!id) return null;
  const store = readStore();
  return store.teacher.id === id ? store.teacher : null;
}

export async function getStudentSession(): Promise<Student | null> {
  const jar = await cookies();
  const token = jar.get(STUDENT_COOKIE)?.value;
  if (!token) return null;
  const store = readStore();
  return store.students.find((s) => s.token === token) ?? null;
}

export function studentByToken(token: string): Student | null {
  const store = readStore();
  return store.students.find((s) => s.token === token) ?? null;
}

export async function apiActor() {
  const jar = await cookies();
  const store = readStore();
  const teacherId = jar.get(TEACHER_COOKIE)?.value;
  if (teacherId === store.teacher.id) {
    return { role: "teacher" as const, store };
  }
  const token = jar.get(STUDENT_COOKIE)?.value;
  const student = store.students.find((s) => s.token === token);
  if (student) return { role: "student" as const, store, student };
  return { role: "none" as const, store };
}
