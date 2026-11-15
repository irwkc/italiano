import { chapterByNumber } from "@/learn/data/a1/chapters";
import type { A1Task } from "@/learn/data/a1/types";
import type { Activity } from "@/learn/types";

/**
 * Names of the CEFR fields written onto each stored activity.
 * The dashboard groups sections by `topic`, so the chapter label goes there too.
 * `level` and `chapter` are the expected selector fields. If the schema on main
 * uses different keys, change only these two constants.
 */
export const A1_LEVEL_FIELD = "level";
export const A1_CHAPTER_FIELD = "chapter";

export function taskToActivity(task: A1Task): Activity {
  const chapter = chapterByNumber(task.chapter).label;
  const shared = {
    id: task.slug,
    title: task.title,
    topic: chapter,
    prompt: task.prompt,
    [A1_LEVEL_FIELD]: "A1" as const,
    [A1_CHAPTER_FIELD]: chapter,
  };
  if (task.type === "quiz") {
    return { ...shared, type: "quiz", options: [...task.options], answer: task.answer };
  }
  return {
    ...shared,
    type: "cloze",
    text: task.text,
    answers: [...task.answers],
    bank: [...task.bank],
  };
}
