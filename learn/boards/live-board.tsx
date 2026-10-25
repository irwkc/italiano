"use client";

import { useCallback, useEffect, useState } from "react";
import { ActivityBoard } from "@/learn/boards/activity-board";
import type { Activity, BoardState, LiveSession } from "@/learn/types";

type Payload = {
  live: LiveSession;
  activity: Activity | null;
};

export function LiveBoard({
  studentId,
  waitingLabel = "Real time доступен во время занятия.",
}: {
  studentId: string;
  waitingLabel?: string;
}) {
  const [data, setData] = useState<Payload | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/aula/api/live?studentId=${encodeURIComponent(studentId)}`, {
      cache: "no-store",
    });
    if (res.ok) setData((await res.json()) as Payload);
  }, [studentId]);

  useEffect(() => {
    let timer = 0;
    let cancelled = false;
    const tick = async () => {
      try {
        await load();
      } catch {
        /* offline poll */
      }
      if (!cancelled) timer = window.setTimeout(tick, 700);
    };
    void tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [load]);

  async function patch(partial: Partial<BoardState>) {
    setData((current) => {
      if (!current) return current;
      return {
        ...current,
        live: {
          ...current.live,
          ...partial,
          picks: partial.picks ?? current.live.picks,
        },
      };
    });
    await fetch("/aula/api/live", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, ...partial }),
    });
  }

  const activity = data?.activity ?? null;
  const live = data?.live;
  const hasNext = Boolean(live && live.index + 1 < live.queue.length);

  async function goNext() {
    if (!live || !hasNext) return;
    const res = await fetch("/aula/api/live", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, index: live.index + 1 }),
    });
    if (res.ok) setData((await res.json()) as Payload);
  }

  if (!activity || !live?.activityId) {
    return (
      <div className="aula-live-wait">
        <p>{waitingLabel}</p>
      </div>
    );
  }

  return (
    <ActivityBoard
      key={`${activity.id}-${live.index}`}
      activity={activity}
      state={{ picks: live.picks, selected: live.selected, checked: live.checked }}
      onChange={patch}
      onNext={hasNext ? () => void goNext() : undefined}
    />
  );
}
