"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import {
  addTopicAction,
  assignHomeworkAction,
  createActivityAction,
  deleteActivityAction,
  deleteTopicAction,
  openLiveAction,
  renameTopicAction,
  reorderActivitiesAction,
} from "@/learn/actions";
import { PracticeBoard } from "@/learn/boards/practice-board";
import { formatLessonWhen } from "@/learn/format";
import type { Activity, Lesson } from "@/learn/types";
import { AulaSelect } from "@/learn/ui/select";

type Ask = "kind" | "homework" | "live" | null;

export function SchedeBank({
  topics,
  activities,
  students,
  lessons,
  liveStudentId,
}: {
  topics: string[];
  activities: Activity[];
  students: { id: string; name: string }[];
  lessons: Lesson[];
  liveStudentId: string | null;
}) {
  const [edit, setEdit] = useState(false);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [compose, setCompose] = useState<string | null>(null);
  const [ask, setAsk] = useState<Ask>(null);
  const [who, setWho] = useState(liveStudentId ?? students[0]?.id ?? "");
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState<number | null>(null);
  const [local, setLocal] = useState<Activity[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [rename, setRename] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const catalog = local ?? activities;

  useEffect(() => {
    setLocal(null);
  }, [activities]);

  const activity = catalog.find((item) => item.id === openId) ?? null;
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    const known = new Set(topics);
    const extra = catalog.map((item) => item.topic).filter((topic) => topic && !known.has(topic));
    const names = [...topics, ...new Set(extra)];
    return names
      .map((topic) => {
        const items = catalog.filter((item) => item.topic === topic);
        return [topic, items] as const;
      })
      .filter(([topic, items]) => {
        if (!q) return true;
        if (topic.toLowerCase().includes(q)) return true;
        return items.some((item) => {
          const blob = `${item.title} ${item.prompt ?? ""} ${item.type === "cloze" ? item.text : ""}`.toLowerCase();
          return blob.includes(q);
        });
      });
  }, [catalog, topics, q]);

  const nextLesson = useMemo(() => {
    if (now == null) return null;
    return (
      lessons
        .filter((l) => l.studentId === who && new Date(l.startsAt).getTime() >= now)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null
    );
  }, [lessons, who, now]);

  function resetAsk() {
    setAsk(null);
    setNote(null);
  }

  function pickActivity(id: string) {
    setOpenId(id);
    setCompose(null);
    resetAsk();
    setWho(liveStudentId ?? students[0]?.id ?? "");
  }

  function toggleEdit() {
    setEdit((on) => !on);
    setCompose(null);
    setRename(null);
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
    if (!activity) return;
    const data = new FormData();
    data.set("studentId", studentId);
    data.set("activityId", activity.id);
    startTransition(async () => {
      const result = await openLiveAction(data);
      setNote(result.error ?? result.ok ?? null);
      setAsk(null);
    });
  }

  function sendHomework() {
    if (!activity || !who) return;
    const data = new FormData();
    data.set("studentId", who);
    data.set("activityId", activity.id);
    startTransition(async () => {
      const result = await assignHomeworkAction(data);
      setNote(result.error ?? result.ok ?? null);
    });
  }

  function onAssignLive() {
    if (liveStudentId) sendLive(liveStudentId);
    else setAsk("live");
  }

  function removeActivity() {
    if (!activity) return;
    if (!window.confirm("Удалить задание из каталога?")) return;
    const data = new FormData();
    data.set("activityId", activity.id);
    startTransition(async () => {
      await deleteActivityAction(data);
      setOpenId(null);
    });
  }

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
          {groups.length === 0 ? (
            <p className="aula-muted">Ничего не нашлось.</p>
          ) : (
            groups.map(([topic, items]) => (
              <section
                key={topic}
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
                {edit ? (
                  <div className="aula-topic-lead">
                    {rename === topic ? (
                      <div className="aula-topic-rename">
                        <form action={renameTopicAction} className="aula-topic-rename-form" onSubmit={() => setRename(null)}>
                          <input type="hidden" name="from" value={topic} />
                          <input className="aula-topic-title-input" name="to" defaultValue={topic} required autoFocus />
                          <button className="aula-text-btn" type="submit">
                            Ок
                          </button>
                          <button className="aula-text-btn" type="button" onClick={() => setRename(null)}>
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
                      <button className="aula-topic-title" type="button" onClick={() => setRename(topic)}>
                        {topic}
                      </button>
                    )}
                    <button
                      className="aula-plus"
                      type="button"
                      aria-label="Добавить задание"
                      onClick={() => {
                        setCompose(topic);
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
                        <span className="aula-muted">{item.type}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
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
              topic={compose}
              pending={pending}
              onCancel={() => setCompose(null)}
              onCreate={(data) => {
                startTransition(async () => {
                  const result = await createActivityAction(data);
                  if (result.error) {
                    setNote(result.error);
                    return;
                  }
                  setNote(null);
                  setCompose(null);
                  if (result.id) setOpenId(result.id);
                });
              }}
            />
          ) : activity ? (
            <>
              <div className="aula-schede-bar">
                <p className="aula-kicker">
                  {activity.topic} · {activity.type}
                </p>
                {edit ? (
                  <button className="btn" type="button" disabled={pending} onClick={removeActivity}>
                    Удалить
                  </button>
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
                  <button type="button" onClick={onAssignLive}>
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
                  {now == null ? null : nextLesson ? (
                    <p className="aula-muted">
                      к уроку {nextLesson.title} · {formatLessonWhen(nextLesson.startsAt)}
                    </p>
                  ) : (
                    <p className="aula-muted">Нет ближайшего урока. Поставьте занятие в календаре.</p>
                  )}
                  <button className="btn btn-primary" type="button" disabled={!nextLesson || pending} onClick={sendHomework}>
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
                </div>
              ) : null}
              {note ? (
                <p className={note.startsWith("Выберите") || note.startsWith("Нет") || note.startsWith("Нуж") ? "aula-err" : "aula-muted"}>
                  {note}
                </p>
              ) : null}
              <PracticeBoard key={activity.id} activity={activity} />
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

function ActivityCompose({
  topic,
  pending,
  onCancel,
  onCreate,
}: {
  topic: string;
  pending: boolean;
  onCancel: () => void;
  onCreate: (data: FormData) => void;
}) {
  const [type, setType] = useState<"quiz" | "cloze">("quiz");
  const [optionsText, setOptionsText] = useState("");
  const [answer, setAnswer] = useState("0");
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
      <label className="aula-label">
        Название
        <input className="aula-select" name="title" required />
      </label>
      <label className="aula-label">
        {type === "quiz" ? "Вопрос" : "Подсказка"}
        <input className="aula-select" name="prompt" required={type === "quiz"} />
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
            <textarea className="aula-select" name="text" required />
          </label>
          <label className="aula-label">
            Ответы по порядку
            <input className="aula-select" name="answers" placeholder="mi, faccio" required />
          </label>
          <label className="aula-label">
            Банк слов
            <input className="aula-select" name="bank" placeholder="mi, faccio, sono" />
          </label>
        </>
      )}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        Сохранить
      </button>
    </form>
  );
}
