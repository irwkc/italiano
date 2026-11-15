import { A1_CHAPTERS } from "@/learn/data/a1/chapters";
import { A1_TASKS } from "@/learn/data/a1/catalog";
import { taskToActivity } from "@/learn/data/a1/to-activity";
import type { Activity, Store } from "@/learn/types";

export type A1MergeResult = {
  inserted: number;
  updated: number;
  unchanged: number;
};

function sameActivity(a: Activity, b: Activity) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Upsert the A1 catalog by stable id.
 * Leaves every activity outside this catalog untouched, including other levels.
 * A second run with the same catalog reports `unchanged` and inserts nothing.
 * Re-import refreshes these ids, so a manual edit of an A1 catalog task is replaced.
 */
export function mergeA1Activities(store: Store): A1MergeResult {
  const result: A1MergeResult = { inserted: 0, updated: 0, unchanged: 0 };
  if (!Array.isArray(store.activities)) store.activities = [];
  if (!Array.isArray(store.topics)) store.topics = [];

  for (const task of A1_TASKS) {
    const next = taskToActivity(task);
    const index = store.activities.findIndex((activity) => activity.id === next.id);
    if (index === -1) {
      store.activities.push(next);
      result.inserted += 1;
      continue;
    }
    if (sameActivity(store.activities[index], next)) {
      result.unchanged += 1;
      continue;
    }
    store.activities[index] = next;
    result.updated += 1;
  }

  for (const chapter of A1_CHAPTERS) {
    if (!store.topics.includes(chapter.label)) store.topics.push(chapter.label);
  }
  return result;
}
