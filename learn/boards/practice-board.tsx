"use client";

import { useState, useTransition } from "react";
import { saveAssignmentProgressAction } from "@/learn/actions";
import { ActivityBoard } from "@/learn/boards/activity-board";
import type { Activity, BoardState } from "@/learn/types";

const empty: BoardState = { picks: {}, selected: null, checked: false };

export function PracticeBoard({
  activity,
  assignmentId,
  initial,
  nextHref,
  isLast,
  initialCorrect,
}: {
  activity: Activity;
  assignmentId?: string;
  initial?: BoardState;
  nextHref?: string;
  isLast?: boolean;
  initialCorrect?: boolean;
}) {
  const [state, setState] = useState<BoardState>(initial ?? empty);
  const [correct, setCorrect] = useState<boolean | null>(
    initial?.checked ? Boolean(initialCorrect) : null,
  );
  const [hint, setHint] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function gapCount() {
    if (activity.type !== "cloze") return 0;
    return activity.text.split("____").length - 1;
  }

  function answered(picks: BoardState["picks"]) {
    if (activity.type === "quiz") return Boolean(picks[activity.id]);
    return Object.values(picks).filter(Boolean).length >= gapCount();
  }

  function persist(next: BoardState, onResult?: (ok: boolean) => void) {
    if (!assignmentId) return;
    const data = new FormData();
    data.set("assignmentId", assignmentId);
    data.set("checked", next.checked ? "1" : "0");
    data.set("picks", JSON.stringify(next.picks));
    startTransition(async () => {
      const result = await saveAssignmentProgressAction(data);
      if (result.error) {
        setHint(result.error);
        if (next.checked) setState((s) => ({ ...s, checked: false }));
        return;
      }
      setHint(null);
      if (typeof result.correct === "boolean") {
        setCorrect(result.correct);
        onResult?.(result.correct);
      }
    });
  }

  function onChange(partial: Partial<BoardState>) {
    setState((s) => {
      const next = {
        ...s,
        ...partial,
        picks: partial.picks ?? s.picks,
      };
      if (partial.checked === true) {
        if (!answered(next.picks)) {
          setHint("Сначала выберите ответ.");
          return { ...s, checked: false };
        }
        persist(next);
        return next;
      }
      if (partial.checked === false) {
        setCorrect(null);
      }
      if (assignmentId && partial.picks) {
        persist({ ...next, checked: false });
      }
      return next;
    });
  }

  function goNext() {
    if (!nextHref) return;
    const el = document.querySelector(nextHref);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {hint ? <p className="aula-err">{hint}</p> : null}
      <ActivityBoard
        activity={activity}
        state={state}
        onChange={onChange}
        onNext={nextHref ? goNext : isLast ? () => undefined : undefined}
        doneLabel={isLast ? "Готово" : undefined}
        busy={pending}
        correctOverride={correct}
      />
    </>
  );
}
