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
};

export function ActivityBoard({ activity, state, onChange, onNext }: Props) {
  const ok = isBoardCorrect(activity, state.picks);

  return (
    <article className="aula-board">
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
        <QuizBoard activity={activity} state={state} onChange={onChange} />
      ) : (
        <ClozeBoard activity={activity} state={state} onChange={onChange} />
      )}
      <div className="aula-check">
        {!state.checked ? (
          <button type="button" className="btn btn-primary" onClick={() => onChange({ checked: true })}>
            Проверить
          </button>
        ) : ok ? (
          <button type="button" className="btn btn-primary" onClick={onNext} disabled={!onNext}>
            Далее
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => onChange({ checked: false, selected: null, picks: {} })}
            >
              Попробовать заново
            </button>
            <button type="button" className="btn btn-primary" onClick={onNext} disabled={!onNext}>
              Далее
            </button>
          </>
        )}
      </div>
    </article>
  );
}
