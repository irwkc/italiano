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

export type QuizActivity = {
  id: string;
  type: "quiz";
  title: string;
  topic: string;
  prompt: string;
  options: string[];
  answer: number;
  image?: string;
};

export type ClozeActivity = {
  id: string;
  type: "cloze";
  title: string;
  topic: string;
  prompt?: string;
  text: string;
  bank: string[];
  answers: string[];
  image?: string;
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
};

export type BoardState = {
  picks: Record<string, string | null>;
  selected: string | null;
  checked: boolean;
};
