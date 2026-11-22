import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBoardCorrect } from "@/learn/boards/score";
import { readFileSync } from "node:fs";
import { A1_CHAPTERS, topicFor } from "@/learn/data/a1/chapters";
import { A1_TASKS } from "@/learn/data/a1/catalog";
import { A1_CATALOG_ID, activitiesEqual, mergeA1Activities } from "@/learn/data/a1/merge";
import { taskToActivity } from "@/learn/data/a1/to-activity";
import { seedStore } from "@/learn/data/seed";
import type { Activity } from "@/learn/types";

const GAP = "____";

function studentText(task: (typeof A1_TASKS)[number]) {
  if (task.type === "quiz") return [task.prompt, task.title, ...task.options].join("\n");
  return [task.prompt, task.title, task.text, ...task.answers, ...task.bank].join("\n");
}

function blob(task: (typeof A1_TASKS)[number]) {
  return `${studentText(task)}\n${task.note}`;
}

describe("A1 catalog", () => {
  it("has 10 chapters and 200 tasks, 20 each", () => {
    assert.equal(A1_CHAPTERS.length, 10);
    assert.equal(A1_TASKS.length, 200);
    for (const chapter of A1_CHAPTERS) {
      const tasks = A1_TASKS.filter((task) => task.chapter === chapter.number);
      assert.equal(tasks.length, 20, chapter.title);
      for (const focus of chapter.focuses) {
        assert.equal(
          tasks.filter((task) => task.focus === focus.key).length,
          5,
          `${chapter.title} / ${focus.topic}`,
        );
      }
      const quiz = tasks.filter((task) => task.type === "quiz").length;
      const cloze = tasks.filter((task) => task.type === "cloze").length;
      assert.ok(quiz >= 6 && cloze >= 6, `${chapter.title} mix quiz=${quiz} cloze=${cloze}`);
    }
  });

  it("uses stable slugs and Russian prompts", () => {
    const slugs = new Set<string>();
    for (const task of A1_TASKS) {
      const chapter = String(task.chapter).padStart(2, "0");
      assert.match(task.slug, new RegExp(`^a1-c${chapter}-\\d{2}$`));
      assert.equal(slugs.has(task.slug), false, task.slug);
      slugs.add(task.slug);
      assert.match(task.prompt, /[А-Яа-яЁё]/, task.slug);
      assert.ok(task.note.trim().length > 0, task.slug);
      assert.equal(task.title.trim().length > 0, true, task.slug);
      assert.equal(task.prompt.includes("\n"), false, task.slug);
    }
  });

  it("has a valid answer key for every task", () => {
    for (const task of A1_TASKS) {
      const activity = taskToActivity(task);
      const meta = A1_CHAPTERS[task.chapter - 1];
      assert.equal(activity.id, task.slug);
      assert.ok(A1_CATALOG_ID.test(activity.id), task.slug);
      assert.equal(activity.topic, topicFor(task.chapter, task.focus), task.slug);
      assert.equal(activity.level, "A1", task.slug);
      assert.deepEqual(activity.chapter, { number: meta?.number, title: meta?.title }, task.slug);
      assert.equal(activity.level === "A1" && activity.chapter != null, true);
      assert.equal("note" in activity, false, task.slug);
      assert.equal("explanation" in activity, false, task.slug);
      assert.equal(JSON.stringify(activity).includes("null"), false, task.slug);

      if (activity.type === "quiz") {
        assert.ok(activity.options.length >= 2, task.slug);
        assert.equal(new Set(activity.options).size, activity.options.length, task.slug);
        assert.ok(Number.isInteger(activity.answer), task.slug);
        assert.ok(activity.answer >= 0 && activity.answer < activity.options.length, task.slug);
        assert.ok(activity.prompt.trim().length > 0, task.slug);
        for (const option of activity.options) assert.equal(option.includes("\n"), false, task.slug);
        assert.equal(isBoardCorrect(activity, { [activity.id]: String(activity.answer) }), true, task.slug);
        const wrong = activity.answer === 0 ? 1 : 0;
        assert.equal(isBoardCorrect(activity, { [activity.id]: String(wrong) }), false, task.slug);
        continue;
      }

      const gaps = activity.text.split(GAP).length - 1;
      assert.equal(gaps, activity.answers.length, task.slug);
      assert.ok(gaps >= 1, task.slug);
      assert.equal(activity.text.includes("_____"), false, task.slug);
      assert.equal(activity.answers.some((answer) => answer.includes(",") || answer.includes(";")), false, task.slug);
      for (const answer of activity.answers) {
        assert.ok(answer.trim().length > 0, task.slug);
        const needed = activity.answers.filter((item) => item === answer).length;
        const have = activity.bank.filter((item) => item === answer).length;
        assert.ok(have >= needed, `${task.slug} bank missing ${answer}`);
      }
      const picks: Record<string, string> = {};
      activity.answers.forEach((answer, index) => {
        picks[String(index)] = answer;
      });
      assert.equal(isBoardCorrect(activity, picks), true, task.slug);
      picks["0"] = activity.bank.find((word) => word !== activity.answers[0]) ?? "";
      if (picks["0"] && picks["0"] !== activity.answers[0]) {
        assert.equal(isBoardCorrect(activity, picks), false, task.slug);
      }
    }
  });

  it("keeps early chapters free of later tenses", () => {
    const later = /\b(ieri|scorso|scorsa|visitato|mangiato|andato|andata|andati|piovuto|svegliato|svegliata|sposato|sposata|sposati)\b/i;
    for (const task of A1_TASKS) {
      if (task.chapter >= 8) continue;
      assert.equal(later.test(studentText(task)), false, `${task.slug} leaks past-tense material`);
    }
    const avere = /\b(ho|hai|ha|abbiamo|avete|hanno)\b/i;
    for (const task of A1_TASKS) {
      if (task.chapter !== 1) continue;
      assert.equal(avere.test(studentText(task)), false, `${task.slug} uses avere`);
    }
  });

  it("matches the JSON file the production importer loads", () => {
    const file = JSON.parse(readFileSync(new URL("./activities.json", import.meta.url), "utf8")) as Activity[];
    const built = A1_TASKS.map(taskToActivity);
    assert.equal(file.length, 200);
    assert.equal(activitiesEqual(file, built), true);
  });

  it("rejects a few impossible spellings in the answer key", () => {
    const correct = A1_TASKS.map((task) => {
      const answer = task.type === "quiz" ? task.options[task.answer] : `${task.text}\n${task.answers.join("\n")}`;
      return [task.prompt, task.title, answer].join("\n");
    }).join("\n");
    for (const bad of ["un amica", "la mia madre", "il mio padre", "il mio fratello", "ventitre", "gli camerieri"]) {
      assert.equal(correct.includes(bad), false, bad);
    }
    const everything = A1_TASKS.map(blob).join("\n");
    for (const bad of ["qual'è", "e'", "\u2019"]) {
      assert.equal(everything.includes(bad), false, bad);
    }
  });
});

describe("mergeA1Activities", () => {
  it("inserts once and leaves other activities alone", () => {
    const store = seedStore();
    const beforeIds = store.activities.map((activity) => activity.id);
    const first = mergeA1Activities(store);
    assert.deepEqual(first, { inserted: 200, updated: 0, unchanged: 0 });
    assert.equal(store.activities.length, beforeIds.length + 200);
    for (const id of beforeIds) {
      assert.ok(store.activities.some((activity) => activity.id === id));
    }
    assert.deepEqual(store.topics, seedStore().topics);
    const foreign = store.activities.find((activity) => activity.id === beforeIds[0]);
    assert.equal(foreign && "level" in foreign, false);
    assert.equal(foreign && "chapter" in foreign, false);

    const second = mergeA1Activities(store);
    assert.deepEqual(second, { inserted: 0, updated: 0, unchanged: 200 });
    assert.equal(store.activities.length, beforeIds.length + 200);

    const sample = store.activities.find((activity) => activity.id === "a1-c01-01");
    assert.ok(sample);
    sample.title = "changed";
    const third = mergeA1Activities(store);
    assert.equal(third.updated, 1);
    assert.equal(third.inserted, 0);
    assert.equal(store.activities.find((activity) => activity.id === "a1-c01-01")?.title, "Ciao");
  });
});
