/**
 * Import the A1 catalog into aula_store (Postgres row id = 1, jsonb column data).
 *
 * From the repo:
 *   npm run import:a1
 *   A1_IMPORT_CONFIRM=local npm run import:a1 -- --apply
 *
 * On the server, from /opt/italiano, after the image that contains this script is deployed:
 *   sudo docker compose exec app node /app/a1-import/import-a1.mjs
 *   sudo docker compose exec -e A1_IMPORT_CONFIRM=production app node /app/a1-import/import-a1.mjs --apply
 *
 * --apply writes only activity ids a1-c01-01 .. a1-c10-20.
 * It copies the current aula_store row to a JSON file before the UPDATE.
 * A second run that finds the same catalog does not write.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const CATALOG_ID = /^a1-c(?:0[1-9]|10)-(?:0[1-9]|1\d|20)$/;

const here = dirname(fileURLToPath(import.meta.url));

export function catalogPath() {
  const candidates = [
    join(here, "activities.json"),
    join(here, "../learn/data/a1/activities.json"),
  ];
  for (const candidate of candidates) {
    try {
      readFileSync(candidate);
      return candidate;
    } catch {
      // try the next location
    }
  }
  throw new Error(`A1 catalog JSON not found next to the script or at learn/data/a1/activities.json`);
}

export function canonicalJson(value) {
  return JSON.stringify(sortValue(value));
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    const sorted = {};
    for (const key of Object.keys(value).sort()) sorted[key] = sortValue(value[key]);
    return sorted;
  }
  return value;
}

export function loadCatalog(file = catalogPath()) {
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(parsed)) throw new Error("A1 catalog must be a JSON array");
  const seen = new Set();
  const titles = new Map();
  for (const activity of parsed) {
    if (!activity || typeof activity !== "object") throw new Error("Catalog entry is not an object");
    if (typeof activity.id !== "string" || !CATALOG_ID.test(activity.id) || seen.has(activity.id)) {
      throw new Error(`Refusing catalog id ${activity.id}`);
    }
    seen.add(activity.id);
    if (activity.level !== "A1") throw new Error(`${activity.id} must have level "A1"`);
    const chapter = activity.chapter;
    if (
      !chapter ||
      typeof chapter !== "object" ||
      !Number.isInteger(chapter.number) ||
      chapter.number < 1 ||
      chapter.number > 10 ||
      typeof chapter.title !== "string" ||
      !chapter.title.trim()
    ) {
      throw new Error(`${activity.id} has an invalid chapter`);
    }
    const previous = titles.get(chapter.number);
    if (previous && previous !== chapter.title) {
      throw new Error(`Chapter ${chapter.number} has two titles`);
    }
    titles.set(chapter.number, chapter.title);
    if (typeof activity.topic !== "string" || !activity.topic.trim()) {
      throw new Error(`${activity.id} is missing topic`);
    }
  }
  if (seen.size !== 200) throw new Error(`Expected 200 A1 tasks, found ${seen.size}`);
  return parsed;
}

export function mergeActivities(store, incoming) {
  const result = { inserted: 0, updated: 0, unchanged: 0 };
  if (!Array.isArray(store.activities)) store.activities = [];
  const seen = new Set();
  for (const next of incoming) {
    if (!CATALOG_ID.test(next.id) || seen.has(next.id)) {
      throw new Error(`Refusing to write activity id ${next.id}`);
    }
    seen.add(next.id);
    const index = store.activities.findIndex((activity) => activity.id === next.id);
    if (index === -1) {
      store.activities.push(next);
      result.inserted += 1;
      continue;
    }
    if (canonicalJson(store.activities[index]) === canonicalJson(next)) {
      result.unchanged += 1;
      continue;
    }
    store.activities[index] = next;
    result.updated += 1;
  }
  return result;
}

export function runMode(argv, env) {
  const apply = argv.includes("--apply");
  if (!apply) return "dry-run";
  if (env.A1_IMPORT_CONFIRM === "production") return "production";
  if (env.A1_IMPORT_CONFIRM === "local") return "local";
  throw new Error("Refusing --apply without A1_IMPORT_CONFIRM=local or A1_IMPORT_CONFIRM=production.");
}

export function assertHostAllowed(mode, databaseUrl) {
  if (mode !== "local" || !databaseUrl) return;
  let host = databaseUrl;
  try {
    host = new URL(databaseUrl).host;
  } catch {
    // keep the raw string
  }
  if (/giacomoschiavon|prod(uction)?/i.test(host)) {
    throw new Error(`Refusing local --apply against ${host}. Use A1_IMPORT_CONFIRM=production on the server.`);
  }
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function writeBackup(raw, env = process.env) {
  const preferred = env.A1_IMPORT_BACKUP_DIR || "/app/learn/data/backups";
  const dirs = [...new Set([preferred, "/tmp/a1-import-backups"])];
  const errors = [];
  for (const dir of dirs) {
    try {
      mkdirSync(dir, { recursive: true });
      const file = join(dir, `aula_store-1-${stamp()}.json`);
      writeFileSync(file, raw.endsWith("\n") ? raw : `${raw}\n`, { flag: "wx" });
      return file;
    } catch (error) {
      errors.push(`${dir}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`Could not write the aula_store backup. ${errors.join(" | ")}`);
}

function databaseHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return "(unparsed DATABASE_URL)";
  }
}

async function withClient(fn) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const loaded = await import("pg");
  const Client = loaded.default?.Client ?? loaded.Client;
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function readRow(client, lock) {
  const sql = lock
    ? "SELECT data::text AS data FROM aula_store WHERE id = 1 FOR UPDATE"
    : "SELECT data::text AS data FROM aula_store WHERE id = 1";
  const row = await client.query(sql);
  if (!row.rows[0]) throw new Error("aula_store row id=1 is missing");
  return row.rows[0].data;
}

export async function main(argv = process.argv, env = process.env) {
  const mode = runMode(argv, env);
  const catalog = loadCatalog();
  assertHostAllowed(mode, env.DATABASE_URL);
  if (!env.DATABASE_URL) {
    if (mode !== "dry-run") throw new Error("DATABASE_URL is not set");
    console.log(JSON.stringify({ mode, database: null, catalog: catalog.length, wrote: false }, null, 2));
    return;
  }
  if (mode === "dry-run") {
    const stats = await withClient(async (client) => {
      const raw = await readRow(client, false);
      const store = JSON.parse(raw);
      return mergeActivities(store, catalog);
    });
    console.log(JSON.stringify({ mode, database: databaseHost(env.DATABASE_URL), ...stats, wrote: false }, null, 2));
    return;
  }
  const outcome = await withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const raw = await readRow(client, true);
      const store = JSON.parse(raw);
      const stats = mergeActivities(store, catalog);
      if (stats.inserted === 0 && stats.updated === 0) {
        await client.query("ROLLBACK");
        return { ...stats, wrote: false, backup: null };
      }
      const backup = writeBackup(raw, env);
      await client.query("UPDATE aula_store SET data = $1::jsonb WHERE id = 1", [JSON.stringify(store)]);
      await client.query("COMMIT");
      return { ...stats, wrote: true, backup };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
  console.log(JSON.stringify({ mode, database: databaseHost(env.DATABASE_URL), ...outcome }, null, 2));
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
