import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { Pool, type PoolClient } from "pg";
import { seedStore } from "@/learn/data/seed";
import { normalizeLive } from "@/learn/live";
import type { Store } from "@/learn/types";

const file = path.join(process.cwd(), "learn/data/store.json");

let writeChain = Promise.resolve();

type GlobalPg = typeof globalThis & { aulaPool?: Pool };

function pool() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const g = globalThis as GlobalPg;
  if (!g.aulaPool) g.aulaPool = new Pool({ connectionString: url });
  return g.aulaPool;
}

function hydrate(raw: Store): Store {
  if (raw.liveStudentId === undefined) raw.liveStudentId = null;
  if (!Array.isArray(raw.live)) raw.live = [];
  if (!Array.isArray(raw.assignments)) raw.assignments = [];
  if (!Array.isArray(raw.lessons)) raw.lessons = [];
  if (!Array.isArray(raw.students)) raw.students = [];
  if (!Array.isArray(raw.activities)) raw.activities = [];
  for (const live of raw.live) normalizeLive(live);
  fillTopics(raw);
  return raw;
}

function fileStore(): Store | null {
  if (!existsSync(file)) return null;
  return hydrate(JSON.parse(readFileSync(file, "utf8")) as Store);
}

function persistFile(store: Store) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(store, null, 2));
}

async function withPg<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const db = pool();
  if (!db) throw new Error("DATABASE_URL is not set");
  const client = await db.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

async function ensureSchema(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS aula_store (
      id integer PRIMARY KEY,
      data jsonb NOT NULL
    )
  `);
}

async function readPg(): Promise<Store> {
  return withPg(async (client) => {
    await ensureSchema(client);
    const row = await client.query<{ data: Store }>("SELECT data FROM aula_store WHERE id = 1");
    if (row.rows[0]) return hydrate(row.rows[0].data);
    const store = fileStore() ?? seedStore();
    hydrate(store);
    await client.query("INSERT INTO aula_store (id, data) VALUES (1, $1::jsonb)", [JSON.stringify(store)]);
    return store;
  });
}

async function mutatePg(fn: (store: Store) => void): Promise<Store> {
  return withPg(async (client) => {
    await client.query("BEGIN");
    try {
      await ensureSchema(client);
      const row = await client.query<{ data: Store }>("SELECT data FROM aula_store WHERE id = 1 FOR UPDATE");
      const store = row.rows[0] ? hydrate(row.rows[0].data) : hydrate(fileStore() ?? seedStore());
      if (!row.rows[0]) {
        await client.query("INSERT INTO aula_store (id, data) VALUES (1, $1::jsonb)", [JSON.stringify(store)]);
      }
      fn(store);
      fillTopics(store);
      await client.query("UPDATE aula_store SET data = $1::jsonb WHERE id = 1", [JSON.stringify(store)]);
      await client.query("COMMIT");
      return store;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
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

export async function readStore(): Promise<Store> {
  if (pool()) return readPg();
  const existing = fileStore();
  if (existing) return existing;
  const seeded = seedStore();
  persistFile(seeded);
  return seeded;
}

export function writeStore(store: Store) {
  persistFile(store);
}

export function mutateStore(fn: (store: Store) => void): Promise<Store> {
  const run = writeChain.then(async () => {
    if (pool()) return mutatePg(fn);
    const store = (fileStore() ?? seedStore()) as Store;
    hydrate(store);
    fn(store);
    persistFile(store);
    return store;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
