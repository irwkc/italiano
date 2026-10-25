import { readStore } from "@/learn/data/store";
import { aulaOrigin } from "@/learn/origin";
import { Dynamic } from "@/learn/ui/dynamic";
import { StudentsPanel, type StudentCard } from "@/learn/ui/students-panel";
import { TeacherNav } from "@/learn/ui/teacher-nav";

export default function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ alunno?: string }>;
}) {
  return (
    <Dynamic>
      <TeacherStudents searchParams={searchParams} />
    </Dynamic>
  );
}

async function TeacherStudents({
  searchParams,
}: {
  searchParams: Promise<{ alunno?: string }>;
}) {
  const { alunno } = await searchParams;
  const store = readStore();
  const origin = await aulaOrigin();

  const students: StudentCard[] = store.students.map((student) => {
    const past = store.lessons
      .filter((l) => l.studentId === student.id)
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        startsAt: lesson.startsAt,
        materials: store.assignments
          .filter((a) => a.lessonId === lesson.id)
          .flatMap((assignment) => {
            const activity = store.activities.find((act) => act.id === assignment.activityId);
            if (!activity) return [];
            return [
              {
                title: activity.title,
                kind: assignment.kind,
                type: activity.type,
              },
            ];
          }),
      }));
    return { id: student.id, name: student.name, token: student.token, past };
  });

  return (
    <>
      <div className="aula-teacher-nav">
        <TeacherNav current="studenti" />
      </div>
      <main className="aula-shell aula-wide">
        <p className="aula-kicker">Classe</p>
        <h1 className="aula-h">Studenti</h1>
        <StudentsPanel students={students} origin={origin} initialId={alunno} />
      </main>
    </>
  );
}
