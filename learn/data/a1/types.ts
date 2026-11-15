/** Source shape for the A1 catalog. The store mapper lives in `to-activity.ts`. */

export type A1QuizTask = {
  slug: string;
  type: "quiz";
  chapter: number;
  /** One of the four program topics for this chapter. Five tasks each. */
  focus: string;
  title: string;
  /** Student instruction, Russian. */
  prompt: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  /** Teacher note. Not imported: the live activity has no feedback field, and the public API would leak it. */
  note: string;
};

export type A1ClozeTask = {
  slug: string;
  type: "cloze";
  chapter: number;
  focus: string;
  title: string;
  prompt: string;
  /** Gaps are exactly four underscores: ____ */
  text: string;
  answers: string[];
  bank: string[];
  note: string;
};

export type A1Task = A1QuizTask | A1ClozeTask;
