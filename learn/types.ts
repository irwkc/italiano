export type Teacher = {
  id: string;
  name: string;
};

export type Student = {
  id: string;
  teacherId: string;
  name: string;
  token: string;
};

export type Lesson = {
  id: string;
  studentId: string;
  startsAt: string;
  endsAt?: string;
  title: string;
};

export type AssignmentKind = "homework" | "classwork";

export type Assignment = {
  id: string;
  lessonId: string;
  activityId: string;
  kind: AssignmentKind;
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
};

export type Store = {
  teacher: Teacher;
  students: Student[];
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
