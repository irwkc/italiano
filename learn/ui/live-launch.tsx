"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { focusLiveAction } from "@/learn/actions";
import { LiveBoard } from "@/learn/boards/live-board";
import { AulaSelect } from "@/learn/ui/select";

type QueueItem = { id: string; title: string };

export function TeacherLiveStudio({
  students,
  liveStudentId,
  meetUrl,
}: {
  students: { id: string; name: string }[];
  liveStudentId: string | null;
  meetUrl?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [index, setIndex] = useState(0);

  const load = useCallback(async () => {
    if (!liveStudentId) {
      setQueue([]);
      setIndex(0);
      return;
    }
    const res = await fetch(`/aula/api/live?studentId=${encodeURIComponent(liveStudentId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as { live: { index: number; rev: number }; queue: QueueItem[] };
    setQueue(data.queue);
    setIndex(data.live.index);
  }, [liveStudentId]);

  useEffect(() => {
    let timer = 0;
    let cancelled = false;
    const tick = async () => {
      try {
        await load();
      } catch {
        /* poll */
      }
      if (!cancelled) timer = window.setTimeout(tick, 1500);
    };
    void tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [load]);

  function pickStudent(id: string) {
    const data = new FormData();
    data.set("studentId", id);
    startTransition(() => focusLiveAction(data));
  }

  async function jump(next: number) {
    if (!liveStudentId || next < 0 || next >= queue.length) return;
    await fetch("/aula/api/live", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: liveStudentId, index: next }),
    });
    setIndex(next);
    void load();
  }

  async function clear() {
    if (!liveStudentId) return;
    await fetch("/aula/api/live", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: liveStudentId, activityId: null }),
    });
    setQueue([]);
    setIndex(0);
    void load();
  }

  const current = queue[index]?.id ?? "";
  const who = students.find((s) => s.id === liveStudentId)?.name;

  return (
    <div className={pending ? "is-pending" : undefined}>
      <div className="aula-schede-head">
        <div>
          <p className="aula-kicker">In diretta</p>
          <h1 className="aula-h">Live</h1>
          {who ? <p className="aula-muted">Сейчас: {who}</p> : null}
        </div>
        {meetUrl ? (
          <a className="btn" href={meetUrl} target="_blank" rel="noreferrer">
            Meet
          </a>
        ) : null}
      </div>
      <div className="aula-live-top">
        <AulaSelect
          label="Ученик"
          value={liveStudentId ?? ""}
          onChange={pickStudent}
          options={[{ value: "", label: "Не выбран" }, ...students.map((s) => ({ value: s.id, label: s.name }))]}
        />
        <AulaSelect
          label="Доска"
          value={current}
          onChange={(id) => void jump(queue.findIndex((item) => item.id === id))}
          options={
            queue.length === 0
              ? [{ value: "", label: "Пусто" }]
              : queue.map((item, i) => ({
                  value: item.id,
                  label: queue.length > 1 ? `${i + 1}/${queue.length}. ${item.title}` : item.title,
                }))
          }
        />
        <button className="btn" type="button" disabled={!liveStudentId} onClick={() => void clear()}>
          Очистить
        </button>
      </div>
      {liveStudentId ? (
        <LiveBoard
          key={`${liveStudentId}-${current || "empty"}`}
          studentId={liveStudentId}
          meetUrl={meetUrl}
          waitingLabel="Очередь пуста — задание берётся из Schede."
        />
      ) : (
        <div className="aula-live-wait">
          <p>Выберите ученика.</p>
        </div>
      )}
    </div>
  );
}
