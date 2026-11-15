import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  matchesChapter,
  matchesLevel,
  normalizeActivityMeta,
  parseChapterFilter,
  parseLevelFilter,
  readActivityChapter,
  readActivityLevel,
  schedeQuery,
} from "@/learn/cefr";
import { seedStore } from "@/learn/data/seed";

describe("normalizeActivityMeta", () => {
  it("does not add level or chapter to existing tasks", () => {
    const activities = seedStore().activities;
    const before = JSON.stringify(activities);
    for (const activity of activities) normalizeActivityMeta(activity);
    assert.equal(JSON.stringify(activities), before);
    for (const activity of activities) {
      assert.equal("level" in activity, false);
      assert.equal("chapter" in activity, false);
    }
  });

  it("keeps a valid level and trims a valid chapter title", () => {
    const activity = {
      id: "a",
      level: "B1",
      chapter: { number: 2, title: "  In città  ", extra: true },
    };
    normalizeActivityMeta(activity);
    assert.equal(activity.level, "B1");
    assert.deepEqual(activity.chapter, { number: 2, title: "In città" });
  });

  it("drops invalid level and chapter without touching the rest", () => {
    const activity = {
      id: "a",
      title: "Saluti",
      topic: "Saluti",
      level: "a1",
      chapter: { number: 0, title: "Nope" },
    };
    normalizeActivityMeta(activity);
    assert.equal("level" in activity, false);
    assert.equal("chapter" in activity, false);
    assert.equal(activity.title, "Saluti");
    assert.equal(activity.topic, "Saluti");
  });
});

describe("filters", () => {
  it("parses level and chapter query values", () => {
    assert.equal(parseLevelFilter(undefined), "all");
    assert.equal(parseLevelFilter("A2"), "A2");
    assert.equal(parseLevelFilter("none"), "none");
    assert.equal(parseLevelFilter("a2"), "all");
    assert.equal(parseChapterFilter("4"), 4);
    assert.equal(parseChapterFilter("none"), "none");
    assert.equal(parseChapterFilter("0"), "all");
    assert.equal(parseChapterFilter("1000"), "all");
  });

  it("matches tasks with and without placement", () => {
    assert.equal(matchesLevel(undefined, "none"), true);
    assert.equal(matchesLevel("A1", "none"), false);
    assert.equal(matchesLevel("A1", "A1"), true);
    assert.equal(matchesLevel(undefined, "all"), true);
    assert.equal(matchesChapter(undefined, "none"), true);
    assert.equal(matchesChapter({ number: 3, title: "Roma" }, 3), true);
    assert.equal(matchesChapter({ number: 3, title: "Roma" }, "none"), false);
  });

  it("builds a stable query string", () => {
    assert.equal(schedeQuery("all", "all"), "");
    assert.equal(schedeQuery("A1", "all"), "?level=A1");
    assert.equal(schedeQuery("none", "none"), "?level=none&chapter=none");
    assert.equal(schedeQuery("B2", 10), "?level=B2&chapter=10");
  });
});

describe("form readers", () => {
  it("reads a level", () => {
    assert.deepEqual(readActivityLevel("A1"), { level: "A1" });
    assert.deepEqual(readActivityLevel("none"), {});
    assert.deepEqual(readActivityLevel(""), {});
    assert.equal(readActivityLevel("beginner").error, "Неизвестный уровень.");
  });

  it("reads a chapter only when number and title are both set", () => {
    assert.deepEqual(readActivityChapter("", ""), {});
    assert.deepEqual(readActivityChapter("1", "Saluti"), { chapter: { number: 1, title: "Saluti" } });
    assert.equal(readActivityChapter("1", "").error?.includes("вместе"), true);
    assert.equal(readActivityChapter("x", "Saluti").error?.includes("Номер"), true);
  });
});
