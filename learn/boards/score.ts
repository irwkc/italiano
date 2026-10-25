import type { Activity, BoardState } from "@/learn/types";

export function quizKey(activityId: string) {
  return activityId;
}

export function clozeKey(index: number) {
  return String(index);
}

export function isQuizCorrect(activity: Extract<Activity, { type: "quiz" }>, picks: BoardState["picks"]) {
  return picks[quizKey(activity.id)] === String(activity.answer);
}

export function isBoardCorrect(activity: Activity, picks: BoardState["picks"]) {
  if (activity.type === "quiz") return isQuizCorrect(activity, picks);
  return activity.answers.every((_, index) => isClozeSlotCorrect(activity, picks, index));
}

export function isClozeSlotCorrect(
  activity: Extract<Activity, { type: "cloze" }>,
  picks: BoardState["picks"],
  index: number,
) {
  return picks[clozeKey(index)] === activity.answers[index];
}

export function remainingBank(bank: string[], picks: BoardState["picks"]) {
  const used = Object.values(picks).filter((v): v is string => Boolean(v));
  const left = [...bank];
  for (const word of used) {
    const i = left.indexOf(word);
    if (i >= 0) left.splice(i, 1);
  }
  return left;
}

export function splitCloze(text: string) {
  return text.split("____");
}
