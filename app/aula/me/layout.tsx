import { redirect } from "next/navigation";
import { getStudentSession } from "@/learn/auth";
import { Dynamic } from "@/learn/ui/dynamic";
import { AulaHeader } from "@/learn/ui/header";

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return (
    <Dynamic>
      <MeShell>{children}</MeShell>
    </Dynamic>
  );
}

async function MeShell({ children }: { children: React.ReactNode }) {
  const student = await getStudentSession();
  if (!student) redirect("/aula/login");
  return (
    <>
      <AulaHeader name={student.name} role="student" />
      {children}
    </>
  );
}
