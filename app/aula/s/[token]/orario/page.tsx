import { notFound } from "next/navigation";
import { studentByToken } from "@/learn/auth";
import { readStore } from "@/learn/data/store";
import { LessonCalendar } from "@/learn/ui/calendar";
import { Dynamic } from "@/learn/ui/dynamic";
import { StudentNav } from "@/learn/ui/student-nav";

export default function StudentOrarioPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Dynamic>
      <StudentOrario params={params} />
    </Dynamic>
  );
}

async function StudentOrario({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const student = studentByToken(token);
  if (!student) notFound();
  const store = readStore();
  const lessons = store.lessons
    .filter((l) => l.studentId === student.id)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <main className="aula-shell aula-wide">
      <StudentNav token={token} current="orario" />
      <p className="aula-kicker">Calendario</p>
      <h1 className="aula-h">Orario</h1>

      <section className="aula-meet-block">
        <p className="aula-kicker">Lezione</p>
        {store.meetUrl ? (
          <p>
            <a className="link" href={store.meetUrl} target="_blank" rel="noreferrer">
              Войти на созвон
            </a>
          </p>
        ) : (
          <p className="aula-muted">Ссылку на видеоконференцию задаст преподаватель.</p>
        )}
      </section>

      <LessonCalendar lessons={lessons} />
    </main>
  );
}
