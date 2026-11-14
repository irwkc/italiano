import type { Activity } from "@/learn/types";

/** Strip answer keys before sending activities to a student client. */
export function publicActivity(activity: Activity): Activity {
  if (activity.type === "quiz") {
    return { ...activity, answer: -1 };
  }
  return { ...activity, answers: activity.answers.map(() => "") };
}
