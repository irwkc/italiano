import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { seedStore } from "@/learn/data/seed";
import { normalizeLive } from "@/learn/live";
import type { Store } from "@/learn/types";

const file = path.join(process.cwd(), "learn/data/store.json");

let writeChain = Promise.resolve();

export function readStore(): Store {
  if (!existsSync(file)) {
    const seeded = seedStore();
    persist(seeded);
    return seeded;
  }
  const store = JSON.parse(readFileSync(file, "utf8")) as Store;
  if (store.liveStudentId === undefined) store.liveStudentId = null;
  for (const live of store.live) normalizeLive(live);
  if (fillTopics(store)) persist(store);
  return store;
}

function fillTopics(store: Store) {
  const seen = new Set<string>();
  const fromActivities: string[] = [];
  for (const activity of store.activities) {
    if (!activity.topic || seen.has(activity.topic)) continue;
    seen.add(activity.topic);
    fromActivities.push(activity.topic);
  }
  if (!Array.isArray(store.topics)) {
    store.topics = fromActivities;
    return true;
  }
  let dirty = false;
  for (const topic of fromActivities) {
    if (store.topics.includes(topic)) continue;
    store.topics.push(topic);
    dirty = true;
  }
  return dirty;
}

function persist(store: Store) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(store, null, 2));
}

export function writeStore(store: Store) {
  persist(store);
}

export function mutateStore(fn: (store: Store) => void): Promise<Store> {
  const run = writeChain.then(() => {
    const store = readStore();
    fn(store);
    persist(store);
    return store;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
