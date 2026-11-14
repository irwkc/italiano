import { createHmac, timingSafeEqual } from "crypto";
import { hashToken, randomToken } from "@/learn/crypto";
import { mutateStore, readStore } from "@/learn/data/store";
import type { MobileSession, Student } from "@/learn/types";

const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function secret() {
  return process.env.SESSION_SECRET || process.env.AULA_PASSWORD || "dev-aula-secret";
}

export type MobileAccessPayload = {
  typ: "mobile_access";
  role: "student";
  id: string;
  sid: string;
  exp: number;
};

export function accessTtlSec() {
  return ACCESS_TTL_SEC;
}

export function signMobileAccess(payload: MobileAccessPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(`mobile:${body}`).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyMobileAccess(raw: string | undefined | null): MobileAccessPayload | null {
  if (!raw) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;
  const expect = createHmac("sha256", secret()).update(`mobile:${body}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as MobileAccessPayload;
    if (payload.typ !== "mobile_access" || payload.role !== "student") return null;
    if (!payload.id || !payload.sid || !payload.exp) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function studentProfile(student: Student) {
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    emailVerifiedAt: student.emailVerifiedAt,
  };
}

export type IssuedTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  student: ReturnType<typeof studentProfile>;
};

async function issueForSession(student: Student, session: MobileSession, refreshRaw: string): Promise<IssuedTokens> {
  const accessToken = signMobileAccess({
    typ: "mobile_access",
    role: "student",
    id: student.id,
    sid: session.id,
    exp: Math.floor(Date.now() / 1000) + ACCESS_TTL_SEC,
  });
  return {
    accessToken,
    refreshToken: refreshRaw,
    expiresIn: ACCESS_TTL_SEC,
    tokenType: "Bearer",
    student: studentProfile(student),
  };
}

export async function createMobileSession(student: Student, userAgent?: string): Promise<IssuedTokens> {
  const refreshRaw = randomToken(48);
  const now = new Date();
  const session: MobileSession = {
    id: `ms-${crypto.randomUUID()}`,
    studentId: student.id,
    refreshHash: hashToken(refreshRaw),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + REFRESH_TTL_MS).toISOString(),
    revokedAt: null,
    userAgent: userAgent?.slice(0, 200) || undefined,
  };
  await mutateStore((draft) => {
    draft.mobileSessions.push(session);
  });
  return issueForSession(student, session, refreshRaw);
}

export async function rotateMobileSession(refreshRaw: string, userAgent?: string): Promise<IssuedTokens | null> {
  const refreshHash = hashToken(refreshRaw);
  let student: Student | null = null;
  let nextSession: MobileSession | null = null;
  let nextRefresh = "";

  await mutateStore((draft) => {
    const current = draft.mobileSessions.find((row) => row.refreshHash === refreshHash);
    if (!current || current.revokedAt) return;
    if (new Date(current.expiresAt).getTime() < Date.now()) {
      current.revokedAt = new Date().toISOString();
      return;
    }
    const owner = draft.students.find((s) => s.id === current.studentId);
    if (!owner?.emailVerifiedAt) {
      current.revokedAt = new Date().toISOString();
      return;
    }
    current.revokedAt = new Date().toISOString();
    nextRefresh = randomToken(48);
    const now = new Date();
    nextSession = {
      id: `ms-${crypto.randomUUID()}`,
      studentId: owner.id,
      refreshHash: hashToken(nextRefresh),
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + REFRESH_TTL_MS).toISOString(),
      revokedAt: null,
      userAgent: userAgent?.slice(0, 200) || current.userAgent,
    };
    draft.mobileSessions.push(nextSession);
    student = owner;
  });

  if (!student || !nextSession || !nextRefresh) return null;
  return issueForSession(student, nextSession, nextRefresh);
}

export async function revokeMobileSession(opts: { refreshToken?: string | null; sessionId?: string | null; studentId?: string | null }) {
  const refreshHash = opts.refreshToken ? hashToken(opts.refreshToken) : null;
  await mutateStore((draft) => {
    for (const row of draft.mobileSessions) {
      if (row.revokedAt) continue;
      const byRefresh = refreshHash && row.refreshHash === refreshHash;
      const bySession = opts.sessionId && row.id === opts.sessionId;
      const byStudent = opts.studentId && !opts.sessionId && !refreshHash && row.studentId === opts.studentId;
      if (byRefresh || bySession || byStudent) {
        row.revokedAt = new Date().toISOString();
      }
    }
  });
}

export async function resolveMobileStudent(accessRaw: string | null) {
  const payload = verifyMobileAccess(accessRaw);
  if (!payload) return null;
  const store = await readStore();
  const session = store.mobileSessions.find((row) => row.id === payload.sid);
  if (!session || session.revokedAt || session.studentId !== payload.id) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) return null;
  const student = store.students.find((s) => s.id === payload.id);
  if (!student?.emailVerifiedAt) return null;
  return { student, session, store };
}
