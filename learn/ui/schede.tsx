"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, useTransition, type FormEvent } from "react";
import {
  addTopicAction,
  assignHomeworkAction,
  createActivityAction,
  deleteActivityAction,
  deleteTopicAction,
  openLiveAction,
  renameTopicAction,
  reorderActivitiesAction,
  updateActivityAction,
} from "@/learn/actions";
import { PracticeBoard } from "@/learn/boards/practice-board";
import {
  CEFR_LEVELS,
  matchesChapter,
  matchesLevel,
  parseChapterFilter,
  parseLevelFilter,
  schedeQuery,
  type ActivityChapter,
  type ChapterFilter,
  type LevelFilter,
} from "@/learn/cefr";
import { formatLessonWhen, typeLabel } from "@/learn/format";
import type { Activity, Lesson } from "@/learn/types";
import { AulaSelect } from "@/learn/ui/select";

type Ask = "kind" | "homework" | "live" | null;

type ChapterHeading = { kicker: string; title: string };

type TaskBucket = {
  key: string;
  heading: ChapterHeading | null;
  chapter: ActivityChapter | null;
  items: Activity[];
  sections: [string, Activity[]][];
};

function activityBlob(item: Activity) {
  return `${item.title} ${item.prompt ?? ""} ${item.type === "cloze" ? item.text : ""}`.toLowerCase();
}

function levelRank(level: Activity["level"]) {
  if (!level) return CEFR_LEVELS.length;
  const index = CEFR_LEVELS.indexOf(level);
  return index === -1 ? CEFR_LEVELS.length : index;
}

export function SchedeBank({
  topics,
  activities,
  students,
  lessons,
  liveStudentId,
  levelQuery,
  chapterQuery,
}: {
  topics: string[];
  activities: Activity[];
  students: { id: string; name: string }[];
  lessons: Lesson[];
  liveStudentId: string | null;
  levelQuery?: string;
  chapterQuery?: string;
}) {
  const router = useRouter();
  const urlLevel = parseLevelFilter(levelQuery);
  const urlChapter = parseChapterFilter(chapterQuery);
  const queryKey = `${levelQuery ?? ""}\n${chapterQuery ?? ""}`;
  const [level, setLevel] = useState<LevelFilter>(urlLevel);
  const [chapter, setChapter] = useState<ChapterFilter>(urlChapter);
  const [querySource, setQuerySource] = useState(queryKey);
  if (queryKey !== querySource) {
    setQuerySource(queryKey);
    setLevel(urlLevel);
    setChapter(urlChapter);
  }

  const [edit, setEdit] = useState(false);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [compose, setCompose] = useState<string | null>(null);
  const [composeChapter, setComposeChapter] = useState<ActivityChapter | null>(null);
  const [editing, setEditing] = useState(false);
  const [ask, setAsk] = useState<Ask>(null);
  const [who, setWho] = useState(liveStudentId ?? students[0]?.id ?? "");
  const [pickedLessonId, setPickedLessonId] = useState<string | null>(null);
  const [lessonTrack, setLessonTrack] = useState({ who, autoId: "" });
  const [note, setNote] = useState<string | null>(null);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const now = useSyncExternalStore(
    () => () => {},
    () => Date.now(),
    () => null as number | null,
  );
  const [local, setLocal] = useState<Activity[] | null>(null);
  const [localSource, setLocalSource] = useState(activities);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [renameKey, setRenameKey] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (activities !== localSource) {
    setLocalSource(activities);
    setLocal(null);
  }

  const catalog = local ?? activities;
  const activity = catalog.find((item) => item.id === openId) ?? null;
  const q = query.trim().toLowerCase();

  const counts = useMemo(() => {
    const next: Record<LevelFilter, number> = {
      all: catalog.length,
      none: 0,
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
    };
    for (const item of catalog) {
      if (item.level) next[item.level] += 1;
      else next.none += 1;
    }
    return next;
  }, [catalog]);

  const levelMatched = useMemo(
    () => catalog.filter((item) => matchesLevel(item.level, level)),
    [catalog, level],
  );

  const chapterChoices = useMemo(() => {
    const map = new Map<number, { title: string; count: number }>();
    let none = 0;
    for (const item of levelMatched) {
      if (!item.chapter) {
        none += 1;
        continue;
      }
      const found = map.get(item.chapter.number);
      if (!found) map.set(item.chapter.number, { title: item.chapter.title, count: 1 });
      else found.count += 1;
    }
    return {
      none,
      list: [...map.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([number, value]) => ({ number, title: value.title, count: value.count })),
    };
  }, [levelMatched]);

  const rendered = useMemo(() => {
    const scoped = levelMatched.filter((item) => matchesChapter(item.chapter, chapter));
    const groupChapters = chapter === "all" && scoped.some((item) => item.chapter);
    const keepEmpty =
      (level === "all" && chapter === "all" && !catalog.some((item) => item.chapter)) || (edit && !groupChapters);

    function sectionsFor(items: Activity[]): [string, Activity[]][] {
      const known = new Set(topics);
      const extra = items.map((item) => item.topic).filter((topic) => topic && !known.has(topic));
      const names = [...topics, ...new Set(extra)];
      return names
        .map((topic) => [topic, items.filter((item) => item.topic === topic)] as [string, Activity[]])
        .filter(([topic, topicItems]) => {
          if (!q) return topicItems.length > 0 || keepEmpty;
          if (topic.toLowerCase().includes(q)) return topicItems.length > 0 || keepEmpty;
          return topicItems.some((item) => activityBlob(item).includes(q));
        });
    }

    let buckets: TaskBucket[];
    if (!groupChapters) {
      const selected =
        typeof chapter === "number" ? scoped.find((item) => item.chapter?.number === chapter)?.chapter ?? null : null;
      buckets = [
        {
          key: "flat",
          heading: selected ? { kicker: `Глава ${selected.number}`, title: selected.title } : null,
          chapter: selected,
          items: scoped,
          sections: [],
        },
      ];
    } else {
      const loose = scoped.filter((item) => !item.chapter);
      const grouped = new Map<string, Activity[]>();
      for (const item of scoped) {
        if (!item.chapter) continue;
        const key = `${item.level ?? "none"}:${item.chapter.number}`;
        const list = grouped.get(key) ?? [];
        list.push(item);
        grouped.set(key, list);
      }
      const chapterBuckets: TaskBucket[] = [...grouped.entries()]
        .sort((a, b) => {
          const ar = levelRank(a[1][0]?.level) * 1000 + (a[1][0]?.chapter?.number ?? 0);
          const br = levelRank(b[1][0]?.level) * 1000 + (b[1][0]?.chapter?.number ?? 0);
          return ar - br;
        })
        .map(([key, items]) => {
          const placed = items[0]?.chapter;
          const showLevel = level === "all" && items[0]?.level;
          return {
            key,
            heading: {
              kicker: showLevel ? `${items[0]?.level} · Глава ${placed?.number ?? ""}` : `Глава ${placed?.number ?? ""}`,
              title: placed?.title ?? "",
            },
            chapter: placed ?? null,
            items,
            sections: [],
          };
        });
      buckets = [];
      if (loose.length && level === "all") {
        buckets.push({ key: "loose", heading: null, chapter: null, items: loose, sections: [] });
        buckets.push(...chapterBuckets);
      } else {
        buckets.push(...chapterBuckets);
        if (loose.length) {
          buckets.push({
            key: "loose",
            heading: { kicker: "Без главы", title: "" },
            chapter: null,
            items: loose,
            sections: [],
          });
        }
      }
    }

    const withSections = buckets
      .map((bucket) => ({ ...bucket, sections: sectionsFor(bucket.items) }))
      .filter((bucket) => bucket.sections.length > 0);
    if (!edit || q) return withSections;
    const shownTopics = new Set(withSections.flatMap((bucket) => bucket.sections.map(([topic]) => topic)));
    const missing = topics.filter((topic) => topic && !shownTopics.has(topic));
    if (missing.length === 0) return withSections;
    const selected =
      typeof chapter === "number" ? chapterChoices.list.find((item) => item.number === chapter) : undefined;
    withSections.push({
      key: "rest",
      heading: withSections.length ? { kicker: "Ещё разделы", title: "" } : null,
      chapter: selected ? { number: selected.number, title: selected.title } : null,
      items: [],
      sections: missing.map((topic) => [topic, []]),
    });
    return withSections;
  }, [catalog, chapter, chapterChoices, edit, level, levelMatched, q, topics]);

  const studentLessons = useMemo(() => {
    if (now == null) return [];
    return lessons
      .filter((l) => l.studentId === who)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [lessons, who, now]);

  const nextLesson = useMemo(() => {
    if (now == null) return null;
    return studentLessons.find((l) => new Date(l.startsAt).getTime() >= now) ?? studentLessons[0] ?? null;
  }, [studentLessons, now]);

  const autoLessonId = nextLesson?.id ?? "";
  if (who !== lessonTrack.who || autoLessonId !== lessonTrack.autoId) {
    setLessonTrack({ who, autoId: autoLessonId });
    setPickedLessonId(null);
  }
  const lessonId = pickedLessonId ?? autoLessonId;
  const shown =
    activity && matchesLevel(activity.level, level) && matchesChapter(activity.chapter, chapter) ? activity : null;

  function writeFilters(nextLevel: LevelFilter, nextChapter: ChapterFilter) {
    setLevel(nextLevel);
    setChapter(nextChapter);
    router.replace(`/aula/insegnante/schede${schedeQuery(nextLevel, nextChapter)}`, { scroll: false });
  }

  function resetAsk() {
    setAsk(null);
    setNote(null);
  }

  function closeCompose() {
    setCompose(null);
    setComposeChapter(null);
    setComposeError(null);
  }

  function pickActivity(id: string) {
    setOpenId(id);
    closeCompose();
    setEditing(false);
    resetAsk();
    setWho(liveStudentId ?? students[0]?.id ?? "");
  }

  function toggleEdit() {
    setEdit((on) => !on);
    closeCompose();
    setEditing(false);
    setRenameKey(null);
    setAdding(false);
    setDragId(null);
    resetAsk();
  }

  function dropOn(topic: string, beforeId: string | null) {
    if (!dragId || dragId === beforeId) return;
    const current = catalog.filter((item) => item.topic === topic).map((item) => item.id);
    const from = current.indexOf(dragId);
    const ids = current.filter((id) => id !== dragId);
    if (beforeId) {
      let at = ids.indexOf(beforeId);
      if (at < 0) at = ids.length;
      if (from !== -1 && current.indexOf(beforeId) > from) at += 1;
      ids.splice(at, 0, dragId);
    } else {
      ids.push(dragId);
    }
    const byId = new Map(catalog.map((item) => [item.id, item]));
    const moving = ids
      .map((id) => byId.get(id))
      .filter((item): item is Activity => Boolean(item))
      .map((item) => ({ ...item, topic }));
    const used = new Set(ids);
    const leftover = catalog.filter((item) => !used.has(item.id));
    const next: Activity[] = [];
    for (const name of topics) {
      if (name === topic) {
        next.push(...moving);
        continue;
      }
      next.push(...leftover.filter((item) => item.topic === name));
    }
    next.push(...leftover.filter((item) => !topics.includes(item.topic)));
    setLocal(next);
    setDragId(null);
    setOverId(null);
    startTransition(() => reorderActivitiesAction(topic, ids));
  }

  function sendLive(studentId: string) {
    if (!shown) return;
    const data = new FormData();
    data.set("studentId", studentId);
    data.set("activityId", shown.id);
    startTransition(async () => {
      const result = await openLiveAction(data);
      setNote(result.error ?? result.ok ?? null);
      setAsk(null);
    });
  }

  function sendHomework() {
    if (!shown || !who || !lessonId) return;
    const data = new FormData();
    data.set("studentId", who);
    data.set("activityId", shown.id);
    data.set("lessonId", lessonId);
    startTransition(async () => {
      const result = await assignHomeworkAction(data);
      setNote(result.error ?? result.ok ?? null);
      if (result.ok) setAsk(null);
    });
  }

  function removeActivity() {
    if (!shown) return;
    if (!window.confirm("Удалить задание из каталога?")) return;
    const data = new FormData();
    data.set("activityId", shown.id);
    startTransition(async () => {
      await deleteActivityAction(data);
      setOpenId(null);
    });
  }

  const levelOptions = [
    { value: "all", label: "Все", count: counts.all },
    ...CEFR_LEVELS.map((item) => ({ value: item, label: item, count: counts[item] })),
    { value: "none", label: "Без уровня", count: counts.none },
  ];

  const showChapters = level !== "all" && chapterChoices.list.length > 0;
  const chapterOptions = [
    { value: "all", label: "Все", count: levelMatched.length },
    ...chapterChoices.list.map((item) => ({
      value: String(item.number),
      label: `${item.number} · ${item.title}`,
      count: item.count,
    })),
    ...(chapterChoices.none > 0 ? [{ value: "none", label: "Без главы", count: chapterChoices.none }] : []),
  ];

  let emptyMessage = edit
    ? "Добавьте раздел и задание — каталог пока пуст."
    : "Каталог пока пуст. Нажмите «Редактировать», чтобы добавить материалы.";
  if (q) emptyMessage = "Ничего не нашлось по запросу.";
  else if (chapter !== "all") emptyMessage = "В этой главе пока нет заданий.";
  else if (level === "none") emptyMessage = "Нет заданий без уровня.";
  else if (level !== "all") emptyMessage = "В этом уровне пока нет заданий.";

  const presetLevel = level !== "all" && level !== "none" ? level : undefined;

  return (
    <>
      <div className="aula-schede-head">
        <div>
          <p className="aula-kicker">Materiale</p>
          <h1 className="aula-h">Schede</h1>
        </div>
        <button className="btn" type="button" onClick={toggleEdit}>
          {edit ? "К каталогу" : "Редактировать"}
        </button>
      </div>

      <FilterBar
        label="Уровень"
        options={levelOptions}
        value={level}
        onChange={(value) => writeFilters(parseLevelFilter(value), "all")}
      />
      {showChapters ? (
        <FilterBar
          label="Глава"
          options={chapterOptions}
          value={String(chapter)}
          onChange={(value) => writeFilters(level, parseChapterFilter(value))}
        />
      ) : null}

      <div className={`aula-schede${edit ? " is-edit" : ""}`}>
        <div>
          <label className="aula-label">
            Поиск
            <input
              className="aula-select"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Тема, название…"
            />
          </label>
          {rendered.length === 0 ? <p className="aula-empty">{emptyMessage}</p> : null}
          {rendered.map((bucket) => (
            <div key={bucket.key}>
              {bucket.heading ? (
                <div className="aula-chapter-head">
                  <p className="aula-kicker">{bucket.heading.kicker}</p>
                  {bucket.heading.title ? <p className="aula-chapter-title">{bucket.heading.title}</p> : null}
                </div>
              ) : null}
              {bucket.sections.map(([topic, items]) => {
                const sectionKey = `${bucket.key}:${topic}`;
                const hideTopicLabel =
                  !edit &&
                  Boolean(bucket.heading?.title) &&
                  bucket.sections.length === 1 &&
                  topic === bucket.heading?.title;
                return (
                  <section
                    key={sectionKey}
                    className="aula-topic"
                    onDragOver={edit ? (event) => event.preventDefault() : undefined}
                    onDrop={
                      edit
                        ? (event) => {
                            event.preventDefault();
                            dropOn(topic, null);
                          }
                        : undefined
                    }
                  >
                    {hideTopicLabel ? null : edit ? (
                      <div className="aula-topic-lead">
                        {renameKey === sectionKey ? (
                          <div className="aula-topic-rename">
                            <form
                              className="aula-topic-rename-form"
                              onSubmit={(event) => {
                                event.preventDefault();
                                const data = new FormData(event.currentTarget);
                                startTransition(async () => {
                                  const result = await renameTopicAction(data);
                                  if (result.error) setNote(result.error);
                                  else setRenameKey(null);
                                });
                              }}
                            >
                              <input type="hidden" name="from" value={topic} />
                              <input className="aula-topic-title-input" name="to" defaultValue={topic} required autoFocus />
                              <button className="aula-text-btn" type="submit">
                                Ок
                              </button>
                              <button className="aula-text-btn" type="button" onClick={() => setRenameKey(null)}>
                                Отмена
                              </button>
                            </form>
                            <form action={deleteTopicAction}>
                              <input type="hidden" name="topic" value={topic} />
                              <button
                                className="aula-text-btn"
                                type="submit"
                                onClick={(event) => {
                                  if (!window.confirm("Удалить раздел и задания в нём?")) event.preventDefault();
                                }}
                              >
                                Удалить
                              </button>
                            </form>
                          </div>
                        ) : (
                          <button className="aula-topic-title" type="button" onClick={() => setRenameKey(sectionKey)}>
                            {topic}
                          </button>
                        )}
                        <button
                          className="aula-plus"
                          type="button"
                          aria-label="Добавить задание"
                          onClick={() => {
                            setCompose(topic);
                            setComposeChapter(bucket.chapter);
                            setEditing(false);
                            setComposeError(null);
                            setOpenId(null);
                            resetAsk();
                          }}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <p className="aula-kicker">{topic}</p>
                    )}
                    <ul className="aula-acc-list">
                      {items.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            draggable={edit}
                            className={`aula-acc-head${openId === item.id ? " is-on" : ""}${dragId === item.id ? " is-drag" : ""}${overId === item.id && dragId !== item.id ? " is-over" : ""}`}
                            onClick={() => {
                              if (dragId) return;
                              pickActivity(item.id);
                            }}
                            onDragStart={
                              edit
                                ? (event) => {
                                    event.dataTransfer.setData("text/plain", item.id);
                                    event.dataTransfer.effectAllowed = "move";
                                    setDragId(item.id);
                                  }
                                : undefined
                            }
                            onDragEnd={
                              edit
                                ? () => {
                                    setDragId(null);
                                    setOverId(null);
                                  }
                                : undefined
                            }
                            onDragOver={
                              edit
                                ? (event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setOverId(item.id);
                                  }
                                : undefined
                            }
                            onDrop={
                              edit
                                ? (event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    dropOn(topic, item.id);
                                  }
                                : undefined
                            }
                          >
                            {edit ? <span className="aula-grip" aria-hidden /> : null}
                            <span className="aula-acc-title">{item.title}</span>
                            {level === "all" && !bucket.heading && item.level ? (
                              <span className="aula-pill">{item.level}</span>
                            ) : null}
                            <span className="aula-muted">{typeLabel(item.type)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          ))}
          {edit ? (
            adding ? (
              <form action={addTopicAction} className="aula-topic-rename is-new">
                <input className="aula-topic-title-input" name="topic" placeholder="Новый раздел" required autoFocus />
                <button className="aula-text-btn" type="submit">
                  Ок
                </button>
                <button className="aula-text-btn" type="button" onClick={() => setAdding(false)}>
                  Отмена
                </button>
              </form>
            ) : (
              <button className="aula-plus-line" type="button" onClick={() => setAdding(true)}>
                + раздел
              </button>
            )
          ) : null}
        </div>

        <div className="aula-schede-preview">
          {edit && compose ? (
            <ActivityCompose
              key={`new-${compose}-${presetLevel ?? ""}-${composeChapter?.number ?? ""}`}
              topic={compose}
              pending={pending}
              error={composeError}
              presetLevel={presetLevel}
              presetChapter={composeChapter}
              onCancel={closeCompose}
              onCreate={(data) => {
                startTransition(async () => {
                  const result = await createActivityAction(data);
                  if (result.error) {
                    setComposeError(result.error);
                    return;
                  }
                  closeCompose();
                  if (result.id) setOpenId(result.id);
                });
              }}
            />
          ) : edit && editing && shown ? (
            <ActivityCompose
              key={shown.id}
              topic={shown.topic}
              pending={pending}
              error={composeError}
              initial={shown}
              onCancel={() => {
                setEditing(false);
                setComposeError(null);
              }}
              onCreate={(data) => {
                data.set("activityId", shown.id);
                startTransition(async () => {
                  const result = await updateActivityAction(data);
                  if (result.error) {
                    setComposeError(result.error);
                    return;
                  }
                  setComposeError(null);
                  setEditing(false);
                });
              }}
            />
          ) : shown ? (
            <>
              <div className="aula-schede-bar">
                <p className="aula-kicker">
                  {shown.level ?? "Без уровня"}
                  {shown.chapter ? ` · Глава ${shown.chapter.number}` : ""}
                  {" · "}
                  {shown.topic} · {typeLabel(shown.type)}
                </p>
                {edit ? (
                  <div className="aula-form-row is-compact">
                    <button className="btn" type="button" disabled={pending} onClick={() => setEditing(true)}>
                      Изменить
                    </button>
                    <button className="btn" type="button" disabled={pending} onClick={removeActivity}>
                      Удалить
                    </button>
                  </div>
                ) : ask == null ? (
                  <button className="btn btn-primary" type="button" onClick={() => setAsk("kind")}>
                    Задать
                  </button>
                ) : (
                  <button className="btn" type="button" onClick={resetAsk}>
                    Отмена
                  </button>
                )}
              </div>
              {!edit && ask === "kind" ? (
                <div className="aula-ask">
                  <button type="button" onClick={() => setAsk("homework")}>
                    На дом
                  </button>
                  <button type="button" onClick={() => setAsk("live")}>
                    В live
                  </button>
                </div>
              ) : null}
              {!edit && ask === "homework" ? (
                <div className="aula-ask-form">
                  <AulaSelect
                    label="Кому"
                    value={who}
                    onChange={setWho}
                    options={students.map((s) => ({ value: s.id, label: s.name }))}
                  />
                  {studentLessons.length === 0 ? (
                    <p className="aula-muted">Нет уроков. Поставьте занятие в календаре.</p>
                  ) : (
                    <AulaSelect
                      label="К уроку"
                      value={lessonId}
                      onChange={setPickedLessonId}
                      options={studentLessons.map((l) => ({
                        value: l.id,
                        label: `${l.title} · ${formatLessonWhen(l.startsAt)}`,
                      }))}
                    />
                  )}
                  <button className="btn btn-primary" type="button" disabled={!lessonId || pending} onClick={sendHomework}>
                    Повесить
                  </button>
                </div>
              ) : null}
              {!edit && ask === "live" ? (
                <div className="aula-ask-form">
                  <AulaSelect
                    label="С кем открыть live"
                    value={who}
                    onChange={setWho}
                    options={students.map((s) => ({ value: s.id, label: s.name }))}
                  />
                  <button className="btn btn-primary" type="button" disabled={!who || pending} onClick={() => sendLive(who)}>
                    Открыть
                  </button>
                  {note && !note.startsWith("Выберите") && !note.startsWith("Нет") ? (
                    <p className="aula-muted">
                      {note} · <Link href="/aula/insegnante">к Live</Link>
                    </p>
                  ) : null}
                </div>
              ) : null}
              {note ? (
                <p className={note.startsWith("Выберите") || note.startsWith("Нет") || note.startsWith("Нуж") || note.startsWith("Это") ? "aula-err" : "aula-muted"}>
                  {note}
                </p>
              ) : null}
              <PracticeBoard key={shown.id} activity={shown} />
            </>
          ) : (
            <p className="aula-muted">
              {edit ? "Выберите задание или добавьте новое из раздела." : "Выберите задание — здесь будет превью."}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function FilterBar({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string; count: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="aula-level-block">
      <p className="aula-kicker">{label}</p>
      <div className="aula-levels" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={option.value === value ? "is-on" : ""}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            <span className="aula-level-count">{option.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ActivityCompose({
  topic,
  pending,
  error,
  initial,
  presetLevel,
  presetChapter,
  onCancel,
  onCreate,
}: {
  topic: string;
  pending: boolean;
  error?: string | null;
  initial?: Activity;
  presetLevel?: Activity["level"];
  presetChapter?: ActivityChapter | null;
  onCancel: () => void;
  onCreate: (data: FormData) => void;
}) {
  const [type, setType] = useState<"quiz" | "cloze">(initial?.type ?? "quiz");
  const [cefr, setCefr] = useState(initial?.level ?? presetLevel ?? "none");
  const [chapterNumber, setChapterNumber] = useState(
    initial?.chapter ? String(initial.chapter.number) : presetChapter ? String(presetChapter.number) : "",
  );
  const [chapterTitle, setChapterTitle] = useState(initial?.chapter?.title ?? presetChapter?.title ?? "");
  const [optionsText, setOptionsText] = useState(
    initial?.type === "quiz" ? initial.options.join("\n") : "",
  );
  const [answer, setAnswer] = useState(initial?.type === "quiz" ? String(initial.answer) : "0");
  const options = optionsText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("type", type);
    data.set("topic", topic);
    data.set("answer", answer);
    data.set("level", cefr);
    onCreate(data);
  }

  return (
    <form onSubmit={submit} className="aula-ask-form">
      <div className="aula-schede-bar">
        <p className="aula-topic-title">{topic}</p>
        <button className="btn" type="button" onClick={onCancel}>
          Отмена
        </button>
      </div>
      <div className="aula-ask">
        <button type="button" className={type === "quiz" ? "is-on" : ""} onClick={() => setType("quiz")}>
          Квиз
        </button>
        <button type="button" className={type === "cloze" ? "is-on" : ""} onClick={() => setType("cloze")}>
          Пропуски
        </button>
      </div>
      <AulaSelect
        name="level"
        label="Уровень"
        value={cefr}
        onChange={setCefr}
        options={[
          { value: "none", label: "Без уровня" },
          ...CEFR_LEVELS.map((item) => ({ value: item, label: item })),
        ]}
      />
      <label className="aula-label">
        Глава — номер
        <input
          className="aula-select"
          name="chapterNumber"
          inputMode="numeric"
          autoComplete="off"
          placeholder="необязательно"
          value={chapterNumber}
          onChange={(event) => setChapterNumber(event.target.value)}
        />
      </label>
      <label className="aula-label">
        Глава — название
        <input
          className="aula-select"
          name="chapterTitle"
          autoComplete="off"
          placeholder="необязательно"
          value={chapterTitle}
          onChange={(event) => setChapterTitle(event.target.value)}
        />
      </label>
      <label className="aula-label">
        Название
        <input className="aula-select" name="title" defaultValue={initial?.title} required />
      </label>
      <label className="aula-label">
        {type === "quiz" ? "Вопрос" : "Подсказка"}
        <input
          className="aula-select"
          name="prompt"
          defaultValue={initial?.prompt ?? ""}
          required={type === "quiz"}
        />
      </label>
      {type === "quiz" ? (
        <>
          <label className="aula-label">
            Варианты — по одному в строке
            <textarea className="aula-select" name="options" value={optionsText} onChange={(e) => setOptionsText(e.target.value)} required />
          </label>
          <AulaSelect
            label="Верный"
            value={answer}
            onChange={setAnswer}
            options={options.map((option, index) => ({ value: String(index), label: option }))}
          />
        </>
      ) : (
        <>
          <label className="aula-label">
            Текст, пропуски как ____
            <textarea className="aula-select" name="text" defaultValue={initial?.type === "cloze" ? initial.text : ""} required />
          </label>
          <label className="aula-label">
            Ответы по порядку
            <input
              className="aula-select"
              name="answers"
              placeholder="mi, faccio"
              defaultValue={initial?.type === "cloze" ? initial.answers.join(", ") : ""}
              required
            />
          </label>
          <label className="aula-label">
            Банк слов
            <input
              className="aula-select"
              name="bank"
              placeholder="mi, faccio, sono"
              defaultValue={initial?.type === "cloze" ? initial.bank.join(", ") : ""}
            />
          </label>
        </>
      )}
      {error ? <p className="aula-err">{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        Сохранить
      </button>
    </form>
  );
}
