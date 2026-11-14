import { mutateStore } from "@/learn/data/store";
import { emptyLive, normalizeLive, showLiveAt } from "@/learn/live";
import { requireMobileStudent } from "@/learn/mobile/auth";
import { apiOk, readJson } from "@/learn/mobile/http";
import { liveStateDto } from "@/learn/mobile/serialize";

/**
 * Advance the live queue by one (same as web student «Далее»).
 * At the end of the queue: no mutation, returns `done: true`.
 */
export async function POST(request: Request) {
  const auth = await requireMobileStudent(request);
  if (!auth.ok) return auth.response;

  let rev: number | undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await readJson<{ rev?: number }>(request);
    if (body.ok && typeof body.data.rev === "number") rev = body.data.rev;
  }

  let stale = false;
  let done = false;
  const store = await mutateStore((draft) => {
    let live = draft.live.find((l) => l.studentId === auth.student.id);
    if (!live) {
      live = emptyLive(auth.student.id);
      draft.live.push(live);
    }
    normalizeLive(live);
    if (typeof rev === "number" && rev < live.rev) {
      stale = true;
      return;
    }
    if (live.queue.length === 0 || live.index + 1 >= live.queue.length) {
      done = true;
      return;
    }
    showLiveAt(live, live.index + 1);
    live.rev += 1;
  });

  const payload = liveStateDto(store, auth.student.id, { done });
  if (stale) {
    return Response.json(
      {
        error: { code: "conflict", message: "Состояние на сервере изменилось." },
        ...payload,
      },
      { status: 409 },
    );
  }
  return apiOk(payload);
}
