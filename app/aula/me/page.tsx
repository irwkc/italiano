import { redirect } from "next/navigation";
import { getStudentSession } from "@/learn/auth";
import { LiveBoard } from "@/learn/boards/live-board";
import { readStore } from "@/learn/data/store";
import { Dynamic } from "@/learn/ui/dynamic";
import { StudentNav } from "@/learn/ui/student-nav";

export default function MeHomePage() {
  return (
    <Dynamic>
      <MeHome />
    </Dynamic>
  );
}

async function MeHome() {
  const student = await getStudentSession();
  if (!student) redirect("/aula/login");
  const store = await readStore();

  return (
    <main className="aula-shell">
      <StudentNav current="home" />
      <div className="aula-live-lead">
        <p className="aula-kicker">In diretta</p>
        <h1 className="aula-h">Live</h1>
        {store.meetUrl ? (
          <p>
            <a className="link" href={store.meetUrl} target="_blank" rel="noreferrer">
              Войти на созвон
            </a>
          </p>
        ) : null}
      </div>
      <LiveBoard
        studentId={student.id}
        meetUrl={store.meetUrl}
        waitingLabel="Когда преподаватель откроет задание, оно появится здесь."
      />
    </main>
  );
}
