import { notFound } from "next/navigation";
import { studentByToken } from "@/learn/auth";
import { PracticeBoard } from "@/learn/boards/practice-board";
import { readStore } from "@/learn/data/store";
import { formatLessonWhen } from "@/learn/format";
import { Dynamic } from "@/learn/ui/dynamic";
import { StudentNav } from "@/learn/ui/student-nav";
import { CompitiFilter } from "./filter";

export default function StudentCompitiPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lezione?: string }>;
}) {
  return (
    <Dynamic>
      <StudentCompiti params={params} searchParams={searchParams} />
    </Dynamic>
  );
}

async function StudentCompiti({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lezione?: string }>;
}) {
  const { token } = await params;
  const { lezione } = await searchParams;
  const student = await studentByToken(token);
  if (!student) notFound();
  const store = await readStore();
  const lessons = store.lessons
    .filter((l) => l.studentId === student.id)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const lessonId = lezione && lessons.some((l) => l.id === lezione) ? lezione : lessons[0]?.id;
  const assignments = store.assignments.filter((a) => a.lessonId === lessonId);

  return (
    <main className="aula-shell aula-stack">
      <StudentNav token={token} current="compiti" />
      <div>
        <p className="aula-kicker">Lavoro</p>
        <h1 className="aula-h">Compiti</h1>
        <CompitiFilter token={token} lessons={lessons} current={lessonId} />
      </div>
      {assignments.length === 0 ? (
        <p className="aula-muted">К этому занятию пока ничего не повесили.</p>
      ) : (
        assignments.map((assignment) => {
          const activity = store.activities.find((a) => a.id === assignment.activityId);
          if (!activity) return null;
          const lesson = lessons.find((l) => l.id === assignment.lessonId);
          return (
            <section key={assignment.id} className="aula-block">
              <p className="aula-pill">
                {assignment.kind === "homework" ? "к уроку" : "in classe"}
                {lesson ? ` · ${formatLessonWhen(lesson.startsAt)}` : ""}
              </p>
              <PracticeBoard activity={activity} />
            </section>
          );
        })
      )}
    </main>
  );
}
