import { redirect } from "next/navigation";
import { getStudentSession } from "@/learn/auth";
import { readStore } from "@/learn/data/store";
import { Dynamic } from "@/learn/ui/dynamic";
import { LessonCalendar } from "@/learn/ui/calendar";
import { StudentNav } from "@/learn/ui/student-nav";

export default function MeOrarioPage() {
  return (
    <Dynamic>
      <MeOrario />
    </Dynamic>
  );
}

async function MeOrario() {
  const student = await getStudentSession();
  if (!student) redirect("/aula/login");
  const store = await readStore();
  const lessons = store.lessons
    .filter((l) => l.studentId === student.id)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <main className="aula-shell aula-wide">
      <StudentNav current="orario" />
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
