"use client";

import { Sketch } from "@/components/sketch";
import { ClozeBoard } from "@/learn/boards/cloze";
import { QuizBoard } from "@/learn/boards/quiz";
import { isBoardCorrect } from "@/learn/boards/score";
import type { Activity, BoardState } from "@/learn/types";
import { GlossText } from "@/learn/ui/gloss";

type Props = {
  activity: Activity;
  state: BoardState;
  onChange: (partial: Partial<BoardState>) => void;
  onNext?: () => void;
  doneLabel?: string;
  busy?: boolean;
  queueLabel?: string;
  /** When set (Compiti server check), overrides local answer keys. */
  correctOverride?: boolean | null;
};

export function ActivityBoard({
  activity,
  state,
  onChange,
  onNext,
  doneLabel,
  busy,
  queueLabel,
  correctOverride,
}: Props) {
  const stripped =
    activity.type === "quiz" ? activity.answer < 0 : activity.answers.every((item) => !item);
  const localOk = isBoardCorrect(activity, state.picks);
  const ok =
    correctOverride != null ? correctOverride : stripped ? null : localOk;
  const canJudge =
    activity.type === "quiz"
      ? Boolean(state.picks[activity.id])
      : activity.type === "cloze"
        ? Object.values(state.picks).filter(Boolean).length >= activity.text.split("____").length - 1
        : true;

  return (
    <article className="aula-board">
      {queueLabel ? <p className="aula-pill">{queueLabel}</p> : null}
      <h2 className="aula-board-title">
        <GlossText text={activity.title} />
      </h2>
      {activity.image ? (
        <Sketch
          src={activity.image}
          alt=""
          width={1152}
          height={864}
          className="aula-illu"
          sizes="(min-width: 720px) 320px, 70vw"
        />
      ) : null}
      {activity.type === "quiz" ? (
        <QuizBoard activity={activity} state={state} onChange={onChange} correctOverride={correctOverride} />
      ) : (
        <ClozeBoard activity={activity} state={state} onChange={onChange} correctOverride={correctOverride} />
      )}
      <div className="aula-check">
        {!state.checked ? (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onChange({ checked: true })}
              disabled={!canJudge || busy}
            >
              Проверить
            </button>
            {!canJudge ? <p className="aula-muted">Выберите ответ.</p> : null}
          </>
        ) : ok == null ? (
          <p className="aula-muted">Проверяем…</p>
        ) : ok ? (
          onNext || doneLabel ? (
            <button type="button" className="btn btn-primary" onClick={onNext}>
              {doneLabel ?? "Далее"}
            </button>
          ) : (
            <p className="aula-muted">Верно.</p>
          )
        ) : (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => onChange({ checked: false, selected: null, picks: {} })}
            >
              Попробовать заново
            </button>
            {onNext || doneLabel ? (
              <button type="button" className="btn btn-primary" onClick={onNext}>
                {doneLabel ?? "Далее"}
              </button>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}
