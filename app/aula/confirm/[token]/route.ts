import { NextRequest, NextResponse } from "next/server";
import { loginStudentSession } from "@/learn/auth";
import { hashToken } from "@/learn/crypto";
import { mutateStore, readStore } from "@/learn/data/store";
import { appUrl } from "@/learn/mail";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const base = appUrl();
  if (!token) {
    return NextResponse.redirect(`${base}/aula/login?err=confirm`);
  }
  const tokenHash = hashToken(token);
  let studentId = "";
  let fail = false;
  await mutateStore((draft) => {
    const row = draft.emailTokens.find((item) => item.tokenHash === tokenHash && item.kind === "confirm");
    if (!row || row.usedAt || new Date(row.expiresAt).getTime() < Date.now()) {
      fail = true;
      return;
    }
    const student = draft.students.find((s) => s.id === row.studentId);
    if (!student) {
      fail = true;
      return;
    }
    student.emailVerifiedAt = new Date().toISOString();
    row.usedAt = new Date().toISOString();
    studentId = student.id;
  });
  if (fail || !studentId) {
    return NextResponse.redirect(`${base}/aula/login?err=confirm`);
  }
  const store = await readStore();
  const student = store.students.find((s) => s.id === studentId);
  if (student) await loginStudentSession(student);
  return NextResponse.redirect(`${base}/aula/me`);
}
