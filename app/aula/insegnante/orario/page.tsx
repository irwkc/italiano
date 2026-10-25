import { setMeetUrlAction } from "@/learn/actions";
import { readStore } from "@/learn/data/store";
import { TeacherCalendar } from "@/learn/ui/calendar";
import { Dynamic } from "@/learn/ui/dynamic";
import { TeacherNav } from "@/learn/ui/teacher-nav";

export default function TeacherOrarioPage() {
  return (
    <Dynamic>
      <TeacherOrario />
    </Dynamic>
  );
}

async function TeacherOrario() {
  const store = readStore();
  const lessons = [...store.lessons].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return (
    <>
      <div className="aula-teacher-nav">
        <TeacherNav current="orario" />
      </div>
      <main className="aula-shell aula-wide">
        <p className="aula-kicker">Calendario</p>
        <h1 className="aula-h">Orario</h1>
        <form action={setMeetUrlAction} className="aula-meet">
          <label className="aula-label" style={{ flex: 1 }}>
            Созвон
            <input className="field" name="meetUrl" defaultValue={store.meetUrl} />
          </label>
          <button className="btn" type="submit">
            Сохранить
          </button>
        </form>
        <TeacherCalendar
          students={store.students.map((s) => ({ id: s.id, name: s.name }))}
          lessons={lessons}
        />
      </main>
    </>
  );
}
