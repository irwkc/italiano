import { chapterByNumber, topicFor } from "@/learn/data/a1/chapters";
import type { A1Task } from "@/learn/data/a1/types";
import type { Activity } from "@/learn/types";

/** Store shape from `learn/cefr.ts`: level string, chapter object, topic = program section. */
export function taskToActivity(task: A1Task): Activity {
  const meta = chapterByNumber(task.chapter);
  const shared = {
    id: task.slug,
    title: task.title,
    topic: topicFor(task.chapter, task.focus),
    prompt: task.prompt,
    level: "A1" as const,
    chapter: { number: meta.number, title: meta.title },
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
