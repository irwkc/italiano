import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { studentByToken } from "@/learn/auth";
import { Dynamic } from "@/learn/ui/dynamic";
import { AulaHeader } from "@/learn/ui/header";

export default function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  return (
    <Dynamic>
      <StudentShell params={params}>{children}</StudentShell>
    </Dynamic>
  );
}

async function StudentShell({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  await cookies();
  const { token } = await params;
  const student = await studentByToken(token);
  if (!student) notFound();
  return (
    <>
      <AulaHeader name={student.name} role="student" />
      {children}
    </>
  );
}
