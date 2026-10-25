import { redirect } from "next/navigation";
import { getTeacherSession } from "@/learn/auth";
import { Dynamic } from "@/learn/ui/dynamic";
import { AulaHeader } from "@/learn/ui/header";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <Dynamic>
      <TeacherShell>{children}</TeacherShell>
    </Dynamic>
  );
}

async function TeacherShell({ children }: { children: React.ReactNode }) {
  const teacher = await getTeacherSession();
  if (!teacher) redirect("/aula/login");
  return (
    <>
      <AulaHeader name={teacher.name} role="teacher" />
      <div className="aula-teacher">{children}</div>
    </>
  );
}
