import { redirect } from "next/navigation";
import { getTeacherSession } from "@/learn/auth";
import { Dynamic } from "@/learn/ui/dynamic";
import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <Dynamic>
      <LoginGate />
    </Dynamic>
  );
}

async function LoginGate() {
  const teacher = await getTeacherSession();
  if (teacher) redirect("/aula/insegnante");
  return (
    <div className="aula-login">
      <LoginForm />
    </div>
  );
}
