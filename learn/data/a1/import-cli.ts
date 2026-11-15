import { mergeA1Activities } from "@/learn/data/a1/merge";
import { mutateStore } from "@/learn/data/store";

/**
 * Load the A1 catalog into the aula store (file, or Postgres when DATABASE_URL is set).
 *
 *   npx tsx learn/data/a1/import-cli.ts
 *   A1_IMPORT_CONFIRM=local npx tsx learn/data/a1/import-cli.ts --apply
 *
 * The default is a dry run: it does not open the database. `--apply` is refused
 * for hosts that look like production. Do not point this at the prod database;
 * production deploys from main and the import stays a local decision.
 */

const PROD_HOST = /giacomoschiavon|prod(uction)?/i;

function databaseHost() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function assertSafeToApply() {
  if (process.env.A1_IMPORT_CONFIRM !== "local") {
    throw new Error("Refusing --apply without A1_IMPORT_CONFIRM=local.");
  }
  const host = databaseHost();
  if (host && PROD_HOST.test(host)) {
    throw new Error(`Refusing --apply against ${host}.`);
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  if (!apply) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          database: databaseHost() ?? "file store (not opened)",
          note: "Pass --apply with A1_IMPORT_CONFIRM=local to write. Nothing was changed.",
        },
        null,
        2,
      ),
    );
    return;
  }
  assertSafeToApply();
  const result = await mutateStore((store) => {
    const stats = mergeA1Activities(store);
    console.log(JSON.stringify({ mode: "apply", ...stats }, null, 2));
  });
  console.log(JSON.stringify({ activities: result.activities.length, topics: result.topics.length }));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
