import { readStore } from "@/learn/data/store";
import { Dynamic } from "@/learn/ui/dynamic";
import { SchedeBank } from "@/learn/ui/schede";
import { TeacherNav } from "@/learn/ui/teacher-nav";

export default function TeacherSchedePage() {
  return (
    <Dynamic>
      <TeacherSchede />
    </Dynamic>
  );
}

async function TeacherSchede() {
  const store = readStore();

  return (
    <>
      <div className="aula-teacher-nav">
        <TeacherNav current="schede" />
      </div>
      <main className="aula-shell aula-wide">
        <SchedeBank
          topics={store.topics}
          activities={store.activities}
          students={store.students.map((s) => ({ id: s.id, name: s.name }))}
          lessons={store.lessons}
          liveStudentId={store.liveStudentId}
        />
      </main>
    </>
  );
}
