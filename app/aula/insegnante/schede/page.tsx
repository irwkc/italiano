import { firstQuery } from "@/learn/cefr";
import { readStore } from "@/learn/data/store";
import { Dynamic } from "@/learn/ui/dynamic";
import { SchedeBank } from "@/learn/ui/schede";
import { TeacherNav } from "@/learn/ui/teacher-nav";

export default function TeacherSchedePage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string | string[]; chapter?: string | string[] }>;
}) {
  return (
    <Dynamic>
      <TeacherSchede searchParams={searchParams} />
    </Dynamic>
  );
}

async function TeacherSchede({
  searchParams,
}: {
  searchParams: Promise<{ level?: string | string[]; chapter?: string | string[] }>;
}) {
  const query = await searchParams;
  const store = await readStore();

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
          levelQuery={firstQuery(query.level)}
          chapterQuery={firstQuery(query.chapter)}
        />
      </main>
    </>
  );
}
