"use client";

import { useCallback, useEffect, useState } from "react";
import { ActivityBoard } from "@/learn/boards/activity-board";
import type { Activity, BoardState, LiveSession } from "@/learn/types";

type Payload = {
  live: LiveSession;
  activity: Activity | null;
  queue: { id: string; title: string }[];
  meetUrl?: string;
  done?: boolean;
};

export function LiveBoard({
  studentId,
  waitingLabel = "Real time доступен во время занятия.",
  meetUrl,
}: {
  studentId: string;
  waitingLabel?: string;
  meetUrl?: string;
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
      if (!cancelled) timer = window.setTimeout(tick, 1500);
    };
    void tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [load]);

  async function patch(partial: Partial<BoardState> & { index?: number }) {
    const rev = data?.live.rev;
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
    const res = await fetch("/aula/api/live", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, rev, ...partial }),
    });
    if (res.ok) setData((await res.json()) as Payload);
    else void load();
  }

  const activity = data?.activity ?? null;
  const live = data?.live;
  const queue = data?.queue ?? [];
  const hasNext = Boolean(live && live.index + 1 < live.queue.length);
  const link = data?.meetUrl || meetUrl;

  async function goNext() {
    if (!live) return;
    if (!hasNext) {
      setData((current) =>
        current
          ? {
              ...current,
              done: true,
              activity: null,
              live: { ...current.live, activityId: null },
            }
          : current,
      );
      return;
    }
    await patch({ index: live.index + 1 });
  }

  if (!activity || !live?.activityId) {
    return (
      <div className="aula-live-wait">
        {link ? (
          <p>
            <a className="link" href={link} target="_blank" rel="noreferrer">
              Войти на созвон
            </a>
          </p>
        ) : null}
        <p>{data?.done || (live && live.queue.length === 0 && live.index === 0) ? "Очередь пуста — можно отдохнуть." : waitingLabel}</p>
      </div>
    );
  }

  return (
    <ActivityBoard
      key={`${activity.id}-${live.index}-${live.rev}`}
      activity={activity}
      state={{ picks: live.picks, selected: live.selected, checked: live.checked }}
      onChange={(partial) => void patch(partial)}
      onNext={() => void goNext()}
      doneLabel={hasNext ? undefined : "Готово"}
      queueLabel={queue.length > 1 ? `${live.index + 1}/${queue.length}` : undefined}
    />
  );
}
