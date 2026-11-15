import type { ActivityChapter, CefrLevel } from "@/learn/cefr";

export type Teacher = {
  id: string;
  name: string;
};

export type Student = {
  id: string;
  teacherId: string;
  name: string;
  email: string;
  passwordHash: string;
  emailVerifiedAt: string | null;
  /** @deprecated legacy magic-link; unused for routing */
  token?: string;
};

export type Invite = {
  id: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  nameHint?: string;
};

export type EmailToken = {
  id: string;
  studentId: string;
  tokenHash: string;
  kind: "confirm" | "reset";
  expiresAt: string;
  usedAt: string | null;
};

export type Lesson = {
  id: string;
  studentId: string;
  startsAt: string;
  endsAt?: string;
  title: string;
};

export type AssignmentKind = "homework" | "classwork";

export type AssignmentProgress = {
  picks: Record<string, string | null>;
  checked: boolean;
  correct: boolean;
  updatedAt: string;
};

export type Assignment = {
  id: string;
  lessonId: string;
  activityId: string;
  kind: AssignmentKind;
  progress?: AssignmentProgress | null;
};

/**
 * Shared catalog fields. `level` and `chapter` are optional — see `learn/cefr.ts`.
 * Omit them when a task has no level or no chapter. Do not set them to null.
 */
type ActivityFields = {
  id: string;
  title: string;
  topic: string;
  image?: string;
  level?: CefrLevel;
  chapter?: ActivityChapter;
};

export type QuizActivity = ActivityFields & {
  type: "quiz";
  prompt: string;
  options: string[];
  answer: number;
};

export type ClozeActivity = ActivityFields & {
  type: "cloze";
  prompt?: string;
  text: string;
  bank: string[];
  answers: string[];
};

export type Activity = QuizActivity | ClozeActivity;

export type LiveSession = {
  studentId: string;
  activityId: string | null;
  queue: string[];
  index: number;
  picks: Record<string, string | null>;
  selected: string | null;
  checked: boolean;
  rev: number;
};

/** Opaque mobile refresh session (hashed token stored server-side). */
export type MobileSession = {
  id: string;
  studentId: string;
  refreshHash: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  userAgent?: string;
};

/** APNs device registration; push send is optional/later. */
export type DeviceToken = {
  id: string;
  studentId: string;
  platform: "ios";
  apnsToken: string;
  appVersion?: string;
  createdAt: string;
  updatedAt: string;
};

export type Store = {
  teacher: Teacher;
  students: Student[];
  invites: Invite[];
  emailTokens: EmailToken[];
  lessons: Lesson[];
  assignments: Assignment[];
  activities: Activity[];
  topics: string[];
  meetUrl: string;
  liveStudentId: string | null;
  live: LiveSession[];
  mobileSessions: MobileSession[];
  deviceTokens: DeviceToken[];
};

export type BoardState = {
  picks: Record<string, string | null>;
  selected: string | null;
  checked: boolean;
};
