import { A1_TASKS } from "@/learn/data/a1/catalog";
import { taskToActivity } from "@/learn/data/a1/to-activity";
import type { Activity, Store } from "@/learn/types";

export type A1MergeResult = {
  inserted: number;
  updated: number;
  unchanged: number;
};

/** Ids this catalog is allowed to write. Nothing else in `activities` is replaced. */
export const A1_CATALOG_ID = /^a1-c(?:0[1-9]|10)-(?:0[1-9]|1\d|20)$/;

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) sorted[key] = sortValue(record[key]);
    return sorted;
  }
  return value;
}

export function activitiesEqual(a: unknown, b: unknown) {
  return canonicalJson(a) === canonicalJson(b);
}

/**
 * Upsert catalog ids only. A second run with the same catalog inserts nothing.
 * Other activities, topics, and the rest of the store are left as they are.
 * Re-import refreshes these ids, so a manual edit of a catalog task is replaced.
 */
export function mergeA1Activities(store: Store, incoming: Activity[] = A1_TASKS.map(taskToActivity)): A1MergeResult {
  const result: A1MergeResult = { inserted: 0, updated: 0, unchanged: 0 };
  if (!Array.isArray(store.activities)) store.activities = [];
  const seen = new Set<string>();

  for (const next of incoming) {
    if (!A1_CATALOG_ID.test(next.id) || seen.has(next.id)) {
      throw new Error(`Refusing to write activity id ${next.id}`);
    }
    seen.add(next.id);
    const index = store.activities.findIndex((activity) => activity.id === next.id);
    if (index === -1) {
      store.activities.push(next);
      result.inserted += 1;
      continue;
    }
    if (activitiesEqual(store.activities[index], next)) {
      result.unchanged += 1;
      continue;
    }
    store.activities[index] = next;
    result.updated += 1;
  }
  return result;
}
