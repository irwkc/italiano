import { redirect } from "next/navigation";
import { getStudentSession } from "@/learn/auth";
import { publicActivity } from "@/learn/activity-public";
import { PracticeBoard } from "@/learn/boards/practice-board";
import { readStore } from "@/learn/data/store";
import { formatLessonWhen, kindLabel } from "@/learn/format";
import { Dynamic } from "@/learn/ui/dynamic";
import { StudentNav } from "@/learn/ui/student-nav";
import { CompitiFilter } from "./filter";

export default function MeCompitiPage({
  searchParams,
}: {
  searchParams: Promise<{ lezione?: string }>;
}) {
  return (
    <Dynamic>
      <MeCompiti searchParams={searchParams} />
    </Dynamic>
  );
}

function defaultLessonId(
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

async function MeCompiti({
  searchParams,
}: {
  searchParams: Promise<{ lezione?: string }>;
}) {
  const student = await getStudentSession();
  if (!student) redirect("/aula/login");
  const { lezione } = await searchParams;
  const store = await readStore();
  const lessons = store.lessons
    .filter((l) => l.studentId === student.id)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const homeworkLessonIds = new Set(
    store.assignments.filter((a) => a.kind === "homework").map((a) => a.lessonId),
  );
  const lessonId =
    lezione && lessons.some((l) => l.id === lezione)
      ? lezione
      : defaultLessonId(lessons, homeworkLessonIds);
  const assignments = store.assignments.filter(
    (a) => a.lessonId === lessonId && a.kind === "homework",
  );

  return (
    <main className="aula-shell aula-stack">
      <StudentNav current="compiti" />
      <div>
        <p className="aula-kicker">Lavoro</p>
        <h1 className="aula-h">Compiti</h1>
        {lessons.length > 0 ? <CompitiFilter lessons={lessons} current={lessonId} /> : null}
      </div>
      {lessons.length === 0 ? (
        <p className="aula-empty">Занятий в расписании пока нет — домашние задания появятся здесь.</p>
      ) : assignments.length === 0 ? (
        <p className="aula-empty">К этому занятию пока ничего не повесили.</p>
      ) : (
        assignments.map((assignment, index) => {
          const activity = store.activities.find((a) => a.id === assignment.activityId);
          if (!activity) {
            return (
              <p key={assignment.id} className="aula-muted">
                Материал удалён.
              </p>
            );
          }
          const lesson = lessons.find((l) => l.id === assignment.lessonId);
          const nextId = assignments[index + 1]?.id;
          return (
            <section key={assignment.id} className="aula-block" id={`as-${assignment.id}`}>
              <p className="aula-pill">
                {kindLabel(assignment.kind)}
                {lesson ? ` · ${formatLessonWhen(lesson.startsAt)}` : ""}
                {assignment.progress?.checked
                  ? assignment.progress.correct
                    ? " · верно"
                    : " · есть ошибки"
                  : ""}
              </p>
              <PracticeBoard
                activity={publicActivity(activity)}
                assignmentId={assignment.id}
                initial={
                  assignment.progress
                    ? {
                        picks: assignment.progress.picks,
                        selected: null,
                        checked: assignment.progress.checked,
                      }
                    : undefined
                }
                initialCorrect={assignment.progress?.correct}
                nextHref={nextId ? `#as-${nextId}` : undefined}
                isLast={!nextId}
              />
            </section>
          );
        })
      )}
    </main>
  );
}
