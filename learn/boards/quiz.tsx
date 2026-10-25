"use client";

import type { BoardState, QuizActivity } from "@/learn/types";
import { isQuizCorrect, quizKey } from "@/learn/boards/score";
import { GlossText } from "@/learn/ui/gloss";

type Props = {
  activity: QuizActivity;
  state: BoardState;
  onChange: (partial: Partial<BoardState>) => void;
};

export function QuizBoard({ activity, state, onChange }: Props) {
  const key = quizKey(activity.id);
  const chosen = state.picks[key];
  const checked = state.checked;
  const ok = checked && isQuizCorrect(activity, state.picks);

  return (
    <div className="aula-task">
      <p className="aula-prompt">
        <GlossText text={activity.prompt} />
      </p>
      <ul className="aula-opts">
        {activity.options.map((option, index) => {
          const value = String(index);
          const selected = chosen === value;
          const isAnswer = index === activity.answer;
          let tone = "";
          if (checked && isAnswer) tone = "is-right";
          else if (checked && selected && !ok) tone = "is-wrong";
          else if (selected) tone = "is-on";
          return (
            <li key={option}>
              <button
                type="button"
                className={`aula-opt ${tone}`}
                disabled={checked}
                onClick={() =>
                  onChange({
                    checked: false,
                    picks: { ...state.picks, [key]: selected ? null : value },
                  })
                }
              >
                {option}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
