import { redirect } from "next/navigation";
import { Dynamic } from "@/learn/ui/dynamic";

export default function TeacherLiveRedirect() {
  return (
    <Dynamic>
      <GoLive />
    </Dynamic>
  );
}

async function GoLive() {
  redirect("/aula/insegnante");
  return null;
}
