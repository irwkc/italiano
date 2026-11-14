import { mutateStore } from "@/learn/data/store";
import { emptyLive, normalizeLive } from "@/learn/live";
import { requireMobileStudent } from "@/learn/mobile/auth";
import { apiOk, readJson } from "@/learn/mobile/http";
import { applyStudentLivePatch, liveStateDto, type LiveMutateBody } from "@/learn/mobile/serialize";

export async function GET(request: Request) {
  const auth = await requireMobileStudent(request);
  if (!auth.ok) return auth.response;
  return apiOk(liveStateDto(auth.store, auth.student.id));
}

export async function PATCH(request: Request) {
  const auth = await requireMobileStudent(request);
  if (!auth.ok) return auth.response;

  const body = await readJson<LiveMutateBody & { index?: number; activityId?: string }>(request);
  if (!body.ok) return body.response;

  let stale = false;
  const store = await mutateStore((draft) => {
    let live = draft.live.find((l) => l.studentId === auth.student.id);
    if (!live) {
      live = emptyLive(auth.student.id);
      draft.live.push(live);
    }
    normalizeLive(live);
    if (typeof body.data.rev === "number" && body.data.rev < live.rev) {
      stale = true;
      return;
    }
    // Student may not change queue / activityId / index via PATCH (use POST /live/next).
    applyStudentLivePatch(live, {
      picks: body.data.picks,
      selected: body.data.selected,
      checked: body.data.checked,
    });
  });

  const payload = liveStateDto(store, auth.student.id);
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
