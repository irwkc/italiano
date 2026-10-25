import type { LiveSession, Store } from "@/learn/types";

export function emptyLive(studentId: string): LiveSession {
  return {
    studentId,
    activityId: null,
    queue: [],
    index: 0,
    picks: {},
    selected: null,
    checked: false,
  };
}

export function normalizeLive(live: LiveSession) {
  if (!Array.isArray(live.queue)) {
    live.queue = live.activityId ? [live.activityId] : [];
  }
  if (typeof live.index !== "number" || live.index < 0) live.index = 0;
  if (live.queue.length === 0) {
    live.index = 0;
    live.activityId = null;
    return;
  }
  if (live.index >= live.queue.length) live.index = live.queue.length - 1;
  live.activityId = live.queue[live.index] ?? null;
}

export function showLiveAt(live: LiveSession, index: number) {
  if (live.queue.length === 0) {
    live.index = 0;
    live.activityId = null;
    live.picks = {};
    live.selected = null;
    live.checked = false;
    return;
  }
  const next = Math.max(0, Math.min(index, live.queue.length - 1));
  const current = live.queue[next] ?? null;
  if (live.index === next && live.activityId === current) return;
  live.index = next;
  live.activityId = current;
  live.picks = {};
  live.selected = null;
  live.checked = false;
}

export function appendLive(live: LiveSession, activityId: string) {
  if (live.queue.includes(activityId)) return "already" as const;
  const empty = live.queue.length === 0;
  live.queue.push(activityId);
  if (empty) showLiveAt(live, 0);
  return "added" as const;
}

export function clearLive(live: LiveSession) {
  live.queue = [];
  showLiveAt(live, 0);
}

export function removeActivityRefs(store: Store, activityId: string) {
  store.assignments = store.assignments.filter((item) => item.activityId !== activityId);
  for (const live of store.live) {
    const cut = live.queue.slice(0, live.index).filter((id) => id === activityId).length;
    live.queue = live.queue.filter((id) => id !== activityId);
    live.index = Math.max(0, live.index - cut);
    if (live.activityId === activityId) {
      live.picks = {};
      live.selected = null;
      live.checked = false;
    }
    normalizeLive(live);
  }
}
