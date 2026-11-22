import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertHostAllowed,
  loadCatalog,
  mergeActivities,
  runMode,
  writeBackup,
} from "./import-a1.mjs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("import-a1", () => {
  it("loads 200 catalog tasks and only their ids", () => {
    const catalog = loadCatalog();
    assert.equal(catalog.length, 200);
    assert.equal(catalog.every((item) => item.level === "A1" && item.chapter?.title), true);
    const store = { activities: [{ id: "quiz-ciao", title: "keep", topic: "Saluti" }], topics: ["Saluti"] };
    const first = mergeActivities(store, catalog);
    assert.deepEqual(first, { inserted: 200, updated: 0, unchanged: 0 });
    assert.equal(store.activities[0].id, "quiz-ciao");
    assert.equal("level" in store.activities[0], false);
    assert.deepEqual(store.topics, ["Saluti"]);
    const second = mergeActivities(store, catalog);
    assert.deepEqual(second, { inserted: 0, updated: 0, unchanged: 200 });
    assert.equal(store.activities.length, 201);
  });

  it("refuses an id outside the A1 catalog", () => {
    assert.throws(() => mergeActivities({ activities: [] }, [{ id: "quiz-ciao", level: "A1" }]), /Refusing/);
  });

  it("requires an explicit confirm to write", () => {
    assert.equal(runMode(["node", "import"], {}), "dry-run");
    assert.equal(runMode(["node", "import", "--apply"], { A1_IMPORT_CONFIRM: "production" }), "production");
    assert.equal(runMode(["node", "import", "--apply"], { A1_IMPORT_CONFIRM: "local" }), "local");
    assert.throws(() => runMode(["node", "import", "--apply"], {}), /Refusing/);
  });

  it("blocks a local apply against a production host", () => {
    assert.throws(
      () => assertHostAllowed("local", "postgres://user:pass@giacomoschiavon.ru:5432/aula"),
      /production/,
    );
    assert.doesNotThrow(() => assertHostAllowed("production", "postgres://user:pass@giacomoschiavon.ru:5432/aula"));
    assert.doesNotThrow(() => assertHostAllowed("local", "postgres://user:pass@localhost:5432/aula"));
  });

  it("writes a backup file before a caller would update", () => {
    const dir = mkdtempSync(join(tmpdir(), "a1-backup-"));
    const file = writeBackup('{"activities":[]}\n', { A1_IMPORT_BACKUP_DIR: dir });
    assert.equal(file.startsWith(dir), true);
  });
});
