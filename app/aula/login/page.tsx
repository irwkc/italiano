import { redirect } from "next/navigation";
import { getStudentSession, getTeacherSession } from "@/learn/auth";
import { Dynamic } from "@/learn/ui/dynamic";
import { LoginForm } from "./form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  return (
    <Dynamic>
      <LoginGate searchParams={searchParams} />
    </Dynamic>
  );
}

async function LoginGate({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const teacher = await getTeacherSession();
  if (teacher) redirect("/aula/insegnante");
  const student = await getStudentSession();
  if (student) redirect("/aula/me");
  const { err } = await searchParams;
  return (
    <div className="aula-login">
      <LoginForm
        banner={
          err === "confirm"
            ? "Ссылка подтверждения устарела. Войдите или попросите новое приглашение."
            : null
        }
      />
    </div>
  );
}
