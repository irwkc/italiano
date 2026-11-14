"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { createInviteAction, deleteStudentAction, updateStudentAction } from "@/learn/actions";
import { formatLessonWhen, kindLabel, typeLabel } from "@/learn/format";
import { CopyLink } from "@/learn/ui/copy-link";

export type PastMaterial = {
  title: string;
  kind: "homework" | "classwork";
  type: "quiz" | "cloze";
  status?: string;
};

export type PastLesson = {
  id: string;
  title: string;
  startsAt: string;
  materials: PastMaterial[];
};

export type StudentCard = {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  past: PastLesson[];
};

export function StudentsPanel({
  students,
  initialId,
}: {
  students: StudentCard[];
  initialId?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(initialId ?? null);
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const now = useSyncExternalStore(
    () => () => {},
    () => Date.now(),
    () => null as number | null,
  );
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteNote, setInviteNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleStudent(id: string) {
    setOpenId((current) => (current === id ? null : id));
    setOpenLesson(null);
  }

  function invite() {
    startTransition(async () => {
      const result = await createInviteAction();
      if (result.error) {
        setInviteNote(result.error);
        setInviteUrl(null);
        return;
      }
      setInviteUrl(result.url ?? null);
      setInviteNote(result.expiresAt ? `Действует до ${new Date(result.expiresAt).toLocaleString("ru-RU")}` : null);
    });
  }

  return (
    <div>
      <div className="aula-form-row is-compact">
        <button className="btn btn-primary" type="button" disabled={pending} onClick={invite}>
          Пригласить
        </button>
        {inviteNote ? <p className="aula-muted">{inviteNote}</p> : null}
      </div>
      {inviteUrl ? <CopyLink url={inviteUrl} /> : null}

      {students.length === 0 ? (
        <p className="aula-empty">Пока никого нет. Создайте ссылку «Пригласить» и отправьте ученику.</p>
      ) : null}

      <ul className="aula-acc-list">
        {students.map((student) => {
          const open = openId === student.id;
          const past = now == null ? [] : student.past.filter((lesson) => new Date(lesson.startsAt).getTime() < now);
          return (
            <li key={student.id} className="aula-acc">
              <button
                type="button"
                className={`aula-acc-head${open ? " is-on" : ""}`}
                aria-expanded={open}
                onClick={() => toggleStudent(student.id)}
              >
                <span>{student.name}</span>
                <span className="aula-muted">
                  {student.verified ? student.email : `${student.email || "без email"} · не подтверждён`}
                </span>
              </button>
              {open ? (
                <div className="aula-acc-body">
                  <form action={updateStudentAction} className="aula-form-row is-compact">
                    <input type="hidden" name="studentId" value={student.id} />
                    <label className="aula-label">
                      Имя
                      <input className="aula-select" name="name" defaultValue={student.name} required />
                    </label>
                    <button className="btn" type="submit">
                      Сохранить
                    </button>
                  </form>
                  <form action={deleteStudentAction}>
                    <input type="hidden" name="studentId" value={student.id} />
                    <button
                      className="aula-text-btn"
                      type="submit"
                      onClick={(event) => {
                        if (!window.confirm("Удалить ученика, занятия и доступ?")) event.preventDefault();
                      }}
                    >
                      Удалить
                    </button>
                  </form>
                  <p className="aula-kicker" style={{ marginTop: "1.5rem" }}>
                    Пройденное
                  </p>
                  {past.length === 0 ? (
                    <p className="aula-muted">Прошедших занятий пока нет.</p>
                  ) : (
                    <ul className="aula-acc-list">
                      {past.map((lesson) => {
                        const shown = openLesson === lesson.id;
                        return (
                          <li key={lesson.id} className="aula-acc">
                            <button
                              type="button"
                              className={`aula-acc-head${shown ? " is-on" : ""}`}
                              aria-expanded={shown}
                              onClick={() => setOpenLesson(shown ? null : lesson.id)}
                            >
                              <span>{lesson.title}</span>
                              <span className="aula-muted">{formatLessonWhen(lesson.startsAt)}</span>
                            </button>
                            {shown ? (
                              <ul className="aula-acc-body aula-list">
                                {lesson.materials.length === 0 ? (
                                  <li className="aula-muted">К занятию ничего не вешали.</li>
                                ) : (
                                  lesson.materials.map((item) => (
                                    <li key={`${lesson.id}-${item.title}`} className="aula-row">
                                      <span>{item.title}</span>
                                      <span className="aula-pill">
                                        {typeLabel(item.type)} · {kindLabel(item.kind)}
                                        {item.status ? ` · ${item.status}` : ""}
                                      </span>
                                    </li>
                                  ))
                                )}
                              </ul>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
