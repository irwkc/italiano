import { redirect } from "next/navigation";
import { getStudentSession, getTeacherSession } from "@/learn/auth";
import { Dynamic } from "@/learn/ui/dynamic";

export default function AulaIndex() {
  return (
    <Dynamic>
      <AulaRedirect />
    </Dynamic>
  );
}

async function AulaRedirect() {
  const teacher = await getTeacherSession();
  if (teacher) redirect("/aula/insegnante");
  const student = await getStudentSession();
  if (student) redirect(`/aula/s/${student.token}`);
  redirect("/aula/login");
  return null;
}
