import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { absoluteMediaUrl, defaultHomeworkLessonId, publicActivityMobile } from "@/learn/mobile/serialize";
import type { Activity } from "@/learn/types";

describe("absoluteMediaUrl", () => {
  it("prefixes relative paths with APP_URL", () => {
    process.env.APP_URL = "https://giacomoschiavon.ru";
    assert.equal(
      absoluteMediaUrl("/sketch/aula-vespa.jpg"),
      "https://giacomoschiavon.ru/sketch/aula-vespa.jpg",
    );
  });

  it("keeps absolute URLs", () => {
    assert.equal(absoluteMediaUrl("https://cdn.example/a.jpg"), "https://cdn.example/a.jpg");
  });

  it("returns null for empty", () => {
    assert.equal(absoluteMediaUrl(null), null);
    assert.equal(absoluteMediaUrl(""), null);
  });
});

describe("publicActivityMobile", () => {
  it("strips quiz answer and absolutizes image", () => {
    process.env.APP_URL = "https://giacomoschiavon.ru";
    const activity: Activity = {
      id: "quiz-1",
      type: "quiz",
      title: "T",
      topic: "X",
      prompt: "Q?",
      options: ["a", "b"],
      answer: 1,
      image: "/sketch/aula-caffe.jpg",
    };
    const pub = publicActivityMobile(activity);
    assert.equal(pub.type, "quiz");
    assert.equal("answer" in pub, false);
    assert.equal(pub.image, "https://giacomoschiavon.ru/sketch/aula-caffe.jpg");
  });
});

describe("defaultHomeworkLessonId", () => {
  it("prefers upcoming lesson with homework", () => {
    const now = Date.now();
    const lessons = [
      { id: "past", startsAt: new Date(now - 86400000).toISOString() },
      { id: "soon", startsAt: new Date(now + 86400000).toISOString() },
    ];
    assert.equal(defaultHomeworkLessonId(lessons, new Set(["soon"])), "soon");
  });
});
