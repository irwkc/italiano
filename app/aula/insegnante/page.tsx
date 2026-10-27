import { readStore } from "@/learn/data/store";
import { Dynamic } from "@/learn/ui/dynamic";
import { TeacherLiveStudio } from "@/learn/ui/live-launch";
import { TeacherNav } from "@/learn/ui/teacher-nav";

export default function TeacherLiveTab() {
  return (
    <Dynamic>
      <TeacherLiveHome />
    </Dynamic>
  );
}

async function TeacherLiveHome() {
  const store = await readStore();

  return (
    <>
      <div className="aula-teacher-nav">
        <TeacherNav current="live" />
      </div>
      <main className="aula-shell aula-wide">
        <TeacherLiveStudio
          students={store.students.map((s) => ({ id: s.id, name: s.name }))}
          liveStudentId={store.liveStudentId}
        />
      </main>
    </>
  );
}
