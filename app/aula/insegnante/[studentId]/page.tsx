import { redirect } from "next/navigation";
import { Dynamic } from "@/learn/ui/dynamic";

export default function TeacherStudentRedirect({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  return (
    <Dynamic>
      <GoToStudent params={params} />
    </Dynamic>
  );
}

async function GoToStudent({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  redirect(`/aula/insegnante/studenti?alunno=${encodeURIComponent(studentId)}`);
  return null;
}
