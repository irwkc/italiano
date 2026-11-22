/**
 * CEFR placement for catalog activities (teacher tab Schede).
 *
 * Stored on each object in `aula_store.data.activities` (one Postgres jsonb
 * document). There is no activities table. Level and chapter are optional
 * and additive: `hydrate()` checks them in memory and does not rewrite
 * activities that omit them, so existing tasks stay unchanged.
 *
 * `level` — omit the property when the task has no level.
 *   Allowed: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
 *   Do not store null, "", or lowercase.
 *
 * `chapter` — omit the property when the task has no chapter.
 *   { "number": <integer 1..999>, "title": <string, 1..160 chars, trimmed> }
 *   Both fields are required together.
 *   `number` is the chapter order and should be unique within one level.
 *   Tasks in the same level that share a number form one chapter; use one title.
 *
 * `topic` (existing, required) stays the section label.
 * Within a chosen level the Schede tab groups by chapter, then by topic.
 * If every task in a chapter uses `topic === chapter.title`, the extra topic
 * heading is hidden in view mode. For a flat chapter of tasks, set `topic`
 * to the chapter title.
 *
 * Teacher tab query string (preserved on reload):
 *   /aula/insegnante/schede
 *   ?level=A1|A2|B1|B2|C1|C2|none
 *   ?chapter=<integer 1..999>|none
 * Absent `level` means all levels. Absent `chapter` means all chapters.
 */

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const CHAPTER_NUMBER_MIN = 1;
export const CHAPTER_NUMBER_MAX = 999;
export const CHAPTER_TITLE_MAX = 160;

export type ActivityChapter = {
  number: number;
  title: string;
};

export type LevelFilter = "all" | "none" | CefrLevel;

export type ChapterFilter = "all" | "none" | number;

const LEVEL_SET = new Set<string>(CEFR_LEVELS);

export function isCefrLevel(value: unknown): value is CefrLevel {
  return typeof value === "string" && LEVEL_SET.has(value);
}

export function firstQuery(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseLevelFilter(raw: string | undefined | null): LevelFilter {
  if (raw === "none") return "none";
  if (isCefrLevel(raw)) return raw;
  return "all";
}

export function parseChapterFilter(raw: string | undefined | null): ChapterFilter {
  if (raw === "none") return "none";
  if (raw && /^[1-9]\d{0,2}$/.test(raw)) {
    const number = Number(raw);
    if (number >= CHAPTER_NUMBER_MIN && number <= CHAPTER_NUMBER_MAX) return number;
  }
  return "all";
}

export function matchesLevel(level: CefrLevel | undefined, filter: LevelFilter): boolean {
  if (filter === "all") return true;
  if (filter === "none") return !level;
  return level === filter;
}

export function matchesChapter(chapter: ActivityChapter | undefined, filter: ChapterFilter): boolean {
  if (filter === "all") return true;
  if (filter === "none") return !chapter;
  return chapter?.number === filter;
}

/** Query string including the leading `?`, or "" when both filters are "all". */
export function schedeQuery(level: LevelFilter, chapter: ChapterFilter): string {
  const params = new URLSearchParams();
  if (level !== "all") params.set("level", level);
  if (chapter !== "all") params.set("chapter", String(chapter));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function readActivityLevel(raw: FormDataEntryValue | null): { error?: string; level?: CefrLevel } {
  const value = String(raw ?? "").trim();
  if (!value || value === "none") return {};
  if (!isCefrLevel(value)) return { error: "Неизвестный уровень." };
  return { level: value };
}

/**
 * Apply the Schede edit form onto an activity.
 * The form always resubmits `level`, `chapterNumber`, and `chapterTitle`
 * (see ActivityCompose). Empty level / empty chapter clears that field.
 * Passing the values that are already on the activity keeps them.
 */
export function applyActivityPlacement<T extends { level?: CefrLevel; chapter?: ActivityChapter }>(
  activity: T,
  formData: FormData,
): { error?: string; activity?: T } {
  const levelRead = readActivityLevel(formData.get("level"));
  if (levelRead.error) return { error: levelRead.error };
  const chapterRead = readActivityChapter(formData.get("chapterNumber"), formData.get("chapterTitle"));
  if (chapterRead.error) return { error: chapterRead.error };
  const next: T = { ...activity };
  delete next.level;
  delete next.chapter;
  if (levelRead.level) next.level = levelRead.level;
  if (chapterRead.chapter) next.chapter = chapterRead.chapter;
  return { activity: next };
}

export function readActivityChapter(
  numberRaw: FormDataEntryValue | null,
  titleRaw: FormDataEntryValue | null,
): { error?: string; chapter?: ActivityChapter } {
  const numberText = String(numberRaw ?? "").trim();
  const title = String(titleRaw ?? "").trim();
  if (!numberText && !title) return {};
  if (!numberText || !title) return { error: "Укажите номер и название главы вместе." };
  if (!/^[1-9]\d{0,2}$/.test(numberText)) {
    return { error: "Номер главы — целое число от 1 до 999." };
  }
  const number = Number(numberText);
  if (number < CHAPTER_NUMBER_MIN || number > CHAPTER_NUMBER_MAX) {
    return { error: "Номер главы — целое число от 1 до 999." };
  }
  if (title.length > CHAPTER_TITLE_MAX) return { error: "Название главы длиннее 160 символов." };
  return { chapter: { number, title } };
}

/**
 * In-memory check only. Invalid level/chapter values are removed.
 * Valid activities, and activities with neither field, are left as stored.
 * Callers must not persist the store just because this ran.
 */
export function normalizeActivityMeta(activity: object): void {
  const record = activity as { level?: unknown; chapter?: unknown };
  if (!isCefrLevel(record.level)) {
    if ("level" in record) delete record.level;
  }
  const chapter = record.chapter;
  if (chapter == null) {
    if ("chapter" in record) delete record.chapter;
    return;
  }
  if (typeof chapter !== "object") {
    delete record.chapter;
    return;
  }
  const number = (chapter as { number?: unknown }).number;
  const title = (chapter as { title?: unknown }).title;
  if (
    typeof number !== "number" ||
    !Number.isInteger(number) ||
    number < CHAPTER_NUMBER_MIN ||
    number > CHAPTER_NUMBER_MAX ||
    typeof title !== "string"
  ) {
    delete record.chapter;
    return;
  }
  const trimmed = title.trim();
  if (!trimmed || trimmed.length > CHAPTER_TITLE_MAX) {
    delete record.chapter;
    return;
  }
  const clean: ActivityChapter = { number, title: trimmed };
  const current = chapter as ActivityChapter & Record<string, unknown>;
  if (current.number !== clean.number || current.title !== clean.title || Object.keys(current).length !== 2) {
    record.chapter = clean;
  }
}
