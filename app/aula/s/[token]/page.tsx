import { notFound } from "next/navigation";
import { studentByToken } from "@/learn/auth";
import { LiveBoard } from "@/learn/boards/live-board";
import { Dynamic } from "@/learn/ui/dynamic";
import { StudentNav } from "@/learn/ui/student-nav";

export default function StudentHomePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Dynamic>
      <StudentHome params={params} />
    </Dynamic>
  );
}

async function StudentHome({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const student = studentByToken(token);
  if (!student) notFound();

  return (
    <main className="aula-shell">
      <StudentNav token={token} current="home" />
      <LiveBoard studentId={student.id} />
    </main>
  );
}
