import type { Activity } from "@/learn/types";

/** Strip answer keys before sending activities to a student client. */
export function publicActivity(activity: Activity): Activity {
  if (activity.type === "quiz") {
    const { answer: _answer, ...rest } = activity;
    return { ...rest, answer: -1 };
  }
  const { answers: _answers, ...rest } = activity;
  return { ...rest, answers: activity.answers.map(() => "") };
}
