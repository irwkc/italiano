"use client";

import { useEffect, useState } from "react";
import { addStudentAction, updateStudentAction } from "@/learn/actions";
import { formatLessonWhen } from "@/learn/format";
import { CopyLink } from "@/learn/ui/copy-link";

export type PastMaterial = {
  title: string;
  kind: "homework" | "classwork";
  type: "quiz" | "cloze";
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
  token: string;
  past: PastLesson[];
};

export function StudentsPanel({
  students,
  origin,
  initialId,
}: {
  students: StudentCard[];
  origin: string;
  initialId?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(initialId ?? null);
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  function toggleStudent(id: string) {
    setOpenId((current) => (current === id ? null : id));
    setOpenLesson(null);
  }

  return (
    <div>
      <form action={addStudentAction} className="aula-form-row is-compact">
        <label className="aula-label">
          Новый ученик
          <input className="aula-select" name="name" placeholder="Имя" required />
        </label>
        <button className="btn btn-primary" type="submit">
          Добавить
        </button>
      </form>

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
                <span className="aula-muted">{now == null ? "" : `${past.length} прошлых`}</span>
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
                  <CopyLink url={`${origin}/aula/s/${student.token}`} />
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
                                        {item.type} · {item.kind === "homework" ? "compito" : "in classe"}
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
