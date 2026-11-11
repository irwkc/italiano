import { NextRequest } from "next/server";
import { apiActor } from "@/learn/auth";
import { mutateStore, readStore } from "@/learn/data/store";
import { emptyLive, normalizeLive, showLiveAt } from "@/learn/live";
import type { LiveSession, Store } from "@/learn/types";

function payload(store: Store, studentId: string) {
  const live = store.live.find((l) => l.studentId === studentId) ?? emptyLive(studentId);
  normalizeLive(live);
  const activity = live.activityId ? (store.activities.find((a) => a.id === live.activityId) ?? null) : null;
  const queue = live.queue.map((id) => ({
    id,
    title: store.activities.find((a) => a.id === id)?.title ?? id,
  }));
  return { live, activity, queue, meetUrl: store.meetUrl };
}

function canSee(actor: Awaited<ReturnType<typeof apiActor>>, studentId: string) {
  if (actor.role === "teacher") return true;
  if (actor.role === "student" && actor.student.id === studentId) return true;
  return false;
}

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("studentId") ?? "";
  const actor = await apiActor();
  if (!studentId || !canSee(actor, studentId)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const store = actor.role === "none" ? await readStore() : actor.store;
  return Response.json(payload(store, studentId));
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as Partial<LiveSession> & {
    studentId?: string;
    index?: number;
    rev?: number;
  };
  const studentId = body.studentId ?? "";
  const actor = await apiActor();
  if (!studentId || !canSee(actor, studentId)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  let stale = false;
  const store = await mutateStore((draft) => {
    let live = draft.live.find((l) => l.studentId === studentId);
    if (!live) {
      live = emptyLive(studentId);
      draft.live.push(live);
    }
    normalizeLive(live);
    if (typeof body.rev === "number" && body.rev < live.rev) {
      stale = true;
      return;
    }
    if ("index" in body) {
      showLiveAt(live, Number(body.index) || 0);
    }
    if (actor.role === "teacher" && "activityId" in body) {
      const nextId = body.activityId ?? null;
      if (nextId && live.queue.includes(nextId)) {
        showLiveAt(live, live.queue.indexOf(nextId));
      } else if (!nextId) {
        live.queue = [];
        showLiveAt(live, 0);
      }
    }
    if ("picks" in body) live.picks = body.picks ?? {};
    if ("selected" in body) live.selected = body.selected ?? null;
    if ("checked" in body) live.checked = Boolean(body.checked);
    live.rev += 1;
  });

  if (stale) {
    return Response.json(payload(store, studentId), { status: 409 });
  }
  return Response.json(payload(store, studentId));
}
