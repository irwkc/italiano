"use client";

import type { BoardState, ClozeActivity } from "@/learn/types";
import { clozeKey, isClozeSlotCorrect, remainingBank, splitCloze } from "@/learn/boards/score";
import { GlossText } from "@/learn/ui/gloss";

type Props = {
  activity: ClozeActivity;
  state: BoardState;
  onChange: (partial: Partial<BoardState>) => void;
};

export function ClozeBoard({ activity, state, onChange }: Props) {
  const parts = splitCloze(activity.text);
  const left = remainingBank(activity.bank, state.picks);
  const checked = state.checked;

  function place(index: number) {
    if (checked) return;
    const key = clozeKey(index);
    const current = state.picks[key];
    if (state.selected) {
      onChange({
        checked: false,
        selected: null,
        picks: { ...state.picks, [key]: state.selected },
      });
      return;
    }
    if (current) {
      onChange({
        selected: current,
        picks: { ...state.picks, [key]: null },
      });
    }
  }

  return (
    <div className="aula-task">
      {activity.prompt ? (
        <p className="aula-lead">
          <GlossText text={activity.prompt} />
        </p>
      ) : null}
      <p className="aula-cloze">
        {parts.map((part, index) => {
          const gap = index < parts.length - 1;
          const key = clozeKey(index);
          const filled = state.picks[key];
          let tone = filled ? "is-on" : "";
          if (checked && gap) {
            tone = isClozeSlotCorrect(activity, state.picks, index) ? "is-right" : "is-wrong";
          }
          return (
            <span key={`p-${index}`}>
              <GlossText text={part} />
              {gap ? (
                <button
                  type="button"
                  className={`aula-gap ${tone}`}
                  disabled={checked}
                  aria-label={`пропуск ${index + 1}`}
                  onClick={() => place(index)}
                >
                  {filled ?? ""}
                </button>
              ) : null}
            </span>
          );
        })}
      </p>
      <ul className="aula-bank">
        {left.map((word, i) => {
          const on = state.selected === word;
          return (
            <li key={`${word}-${i}`}>
              <button
                type="button"
                className={`aula-chip ${on ? "is-on" : ""}`}
                disabled={checked}
                onClick={() => onChange({ selected: on ? null : word })}
              >
                {word}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
