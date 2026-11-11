import { cookies } from "next/headers";
import { signSession, verifySession } from "@/learn/crypto";
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

const TEACHER_MAX_AGE = 60 * 60 * 24 * 30;
const STUDENT_MAX_AGE = 60 * 60 * 24 * 30;

export async function loginTeacher(name: string, password: string): Promise<boolean> {
  const store = await readStore();
  const expected = process.env.AULA_PASSWORD;
  if (!expected) return false;
  if (name.trim().toLowerCase() !== store.teacher.name.toLowerCase()) return false;
  if (password !== expected) return false;
  const jar = await cookies();
  jar.set(
    TEACHER_COOKIE,
    signSession({
      role: "teacher",
      id: store.teacher.id,
      exp: Math.floor(Date.now() / 1000) + TEACHER_MAX_AGE,
    }),
    { ...cookieBase, maxAge: TEACHER_MAX_AGE },
  );
  return true;
}

export async function loginStudentSession(student: Student) {
  const jar = await cookies();
  jar.set(
    STUDENT_COOKIE,
    signSession({
      role: "student",
      id: student.id,
      exp: Math.floor(Date.now() / 1000) + STUDENT_MAX_AGE,
    }),
    { ...cookieBase, maxAge: STUDENT_MAX_AGE },
  );
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
  const payload = verifySession(jar.get(TEACHER_COOKIE)?.value);
  if (!payload || payload.role !== "teacher") return null;
  const store = await readStore();
  return store.teacher.id === payload.id ? store.teacher : null;
}

export async function getStudentSession(): Promise<Student | null> {
  const jar = await cookies();
  const payload = verifySession(jar.get(STUDENT_COOKIE)?.value);
  if (!payload || payload.role !== "student") return null;
  const store = await readStore();
  const student = store.students.find((s) => s.id === payload.id) ?? null;
  if (!student?.emailVerifiedAt) return null;
  return student;
}

export async function requireStudentSession() {
  return getStudentSession();
}

export async function apiActor() {
  const jar = await cookies();
  const store = await readStore();
  const teacherPayload = verifySession(jar.get(TEACHER_COOKIE)?.value);
  if (teacherPayload?.role === "teacher" && teacherPayload.id === store.teacher.id) {
    return { role: "teacher" as const, store };
  }
  const studentPayload = verifySession(jar.get(STUDENT_COOKIE)?.value);
  if (studentPayload?.role === "student") {
    const student = store.students.find((s) => s.id === studentPayload.id);
    if (student?.emailVerifiedAt) return { role: "student" as const, store, student };
  }
  return { role: "none" as const, store };
}
