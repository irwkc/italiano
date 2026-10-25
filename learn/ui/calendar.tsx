"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createLessonAction, moveLessonAction } from "@/learn/actions";
import { addHour, dayKey, formatDayKey, formatMonth, formatTimeRange, lessonDayKey, timeFromIso } from "@/learn/format";
import type { Lesson } from "@/learn/types";
import { AulaSelect } from "@/learn/ui/select";

const DOW = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function TimeField({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [h, m] = value.split(":");
  const hour = HOURS.includes(h) ? h : "16";
  const minute = MINUTES.includes(m) ? m : "00";
  return (
    <span className="aula-time">
      <input type="hidden" name={name} value={`${hour}:${minute}`} />
      <select key={hour} className="aula-date" aria-label="часы" value={hour} onChange={(e) => onChange(`${e.target.value}:${minute}`)}>
        {HOURS.map((hh) => (
          <option key={hh} value={hh}>
            {hh}
          </option>
        ))}
      </select>
      <span>:</span>
      <select key={minute} className="aula-date" aria-label="минуты" value={minute} onChange={(e) => onChange(`${hour}:${e.target.value}`)}>
        {MINUTES.map((mm) => (
          <option key={mm} value={mm}>
            {mm}
          </option>
        ))}
      </select>
    </span>
  );
}

function useClientReady() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function MoveLessonForm({ lesson }: { lesson: Lesson }) {
  const ready = useClientReady();
  const [edit, setEdit] = useState<{ start: string; end: string } | null>(null);

  if (!ready) return null;

  const startTime = edit?.start ?? timeFromIso(lesson.startsAt);
  const endTime = edit?.end ?? (lesson.endsAt ? timeFromIso(lesson.endsAt) : addHour(startTime));

  return (
    <form action={moveLessonAction} className="aula-form-row is-lesson">
      <input type="hidden" name="lessonId" value={lesson.id} />
      <input type="hidden" name="studentId" value={lesson.studentId} />
      <input type="hidden" name="day" value={lessonDayKey(lesson.startsAt)} />
      <label className="aula-label">
        С
        <TimeField
          name="startTime"
          value={startTime}
          onChange={(value) => setEdit({ start: value, end: addHour(value) })}
        />
      </label>
      <label className="aula-label">
        По
        <TimeField name="endTime" value={endTime} onChange={(value) => setEdit({ start: startTime, end: value })} />
      </label>
      <label className="aula-label">
        Тема
        <input className="aula-select" name="title" defaultValue={lesson.title} />
      </label>
      <button className="btn" type="submit">
        Сдвинуть
      </button>
    </form>
  );
}

function monthCursor(lessons: Lesson[]) {
  const now = Date.now();
  const next = lessons.find((l) => new Date(l.startsAt).getTime() >= now) ?? lessons[0];
  if (!next) {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  }
  const d = new Date(next.startsAt);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function cellsFor(year: number, month: number) {
  const first = new Date(year, month, 1);
  const weekday = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - weekday);
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
}

function useCalendar(lessons: Lesson[]) {
  const [{ year, month }, setCursor] = useState(() => monthCursor(lessons));
  const [today, setToday] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const now = dayKey(new Date());
    setToday(now);
    setSelected((current) => {
      if (current) return current;
      const upcoming = lessons.find((l) => new Date(l.startsAt).getTime() >= Date.now());
      return upcoming ? lessonDayKey(upcoming.startsAt) : now;
    });
  }, [lessons]);

  const byDay = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const lesson of lessons) {
      const key = lessonDayKey(lesson.startsAt);
      const list = map.get(key) ?? [];
      list.push(lesson);
      map.set(key, list);
    }
    return map;
  }, [lessons]);

  return { year, month, setCursor, today, selected, setSelected, byDay, cells: cellsFor(year, month) };
}

function Grid({
  year,
  month,
  setCursor,
  today,
  selected,
  setSelected,
  byDay,
  cells,
  who,
}: ReturnType<typeof useCalendar> & { who?: Record<string, string> }) {
  return (
    <>
      <div className="aula-cal-nav">
        <button
          type="button"
          onClick={() =>
            setCursor((c) => {
              const d = new Date(c.year, c.month - 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })
          }
        >
          Indietro
        </button>
        <p className="aula-cal-month">{formatMonth(year, month)}</p>
        <button
          type="button"
          onClick={() =>
            setCursor((c) => {
              const d = new Date(c.year, c.month + 1, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })
          }
        >
          Avanti
        </button>
      </div>

      <div className="aula-cal-grid">
        {DOW.map((label) => (
          <div key={label} className="aula-cal-dow">
            {label}
          </div>
        ))}
        {cells.map((date) => {
          const key = dayKey(date);
          const outside = date.getMonth() !== month;
          const marks = byDay.get(key) ?? [];
          return (
            <button
              key={key}
              type="button"
              className={`aula-cal-day${outside ? " is-out" : ""}${selected === key ? " is-on" : ""}${today === key ? " is-today" : ""}`}
              onClick={() => setSelected(key)}
            >
              <span className="aula-cal-num">{date.getDate()}</span>
              {!outside
                ? marks.map((lesson) => (
                    <span key={lesson.id} className="aula-cal-mark">
                      <span className="aula-cal-time">{formatTimeRange(lesson.startsAt, lesson.endsAt)}</span>
                      {who ? <span className="aula-cal-who">{who[lesson.studentId]}</span> : null}
                      {lesson.title}
                    </span>
                  ))
                : null}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function LessonCalendar({ lessons }: { lessons: Lesson[] }) {
  const cal = useCalendar(lessons);
  const dayLessons = cal.selected ? (cal.byDay.get(cal.selected) ?? []) : [];

  return (
    <div className="aula-cal">
      <Grid {...cal} />
      {cal.selected ? (
        <section className="aula-cal-detail">
          <p className="aula-kicker">{formatDayKey(cal.selected)}</p>
          {dayLessons.length === 0 ? (
            <p className="aula-muted">В этот день занятия нет.</p>
          ) : (
            <ul className="aula-list">
              {dayLessons.map((lesson) => (
                <li key={lesson.id} className="aula-row">
                  <span>{lesson.title}</span>
                  <span className="aula-muted">{formatTimeRange(lesson.startsAt, lesson.endsAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

export function TeacherCalendar({
  students,
  lessons,
}: {
  students: { id: string; name: string }[];
  lessons: Lesson[];
}) {
  const who = Object.fromEntries(students.map((s) => [s.id, s.name]));
  const [student, setStudent] = useState(students[0]?.id ?? "");
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:00");
  const cal = useCalendar(lessons);
  const dayLessons = cal.selected ? (cal.byDay.get(cal.selected) ?? []) : [];

  function onStart(value: string) {
    setStartTime(value);
    setEndTime(addHour(value));
  }

  return (
    <div className="aula-cal">
      <Grid {...cal} who={who} />
      {cal.selected ? (
        <section className="aula-cal-detail">
          <p className="aula-kicker">{formatDayKey(cal.selected)}</p>
          {dayLessons.map((lesson) => (
            <div key={`${lesson.id}-${lesson.startsAt}-${lesson.endsAt ?? ""}`} className="aula-cal-lesson">
              <p className="aula-muted">{who[lesson.studentId]}</p>
              <MoveLessonForm lesson={lesson} />
            </div>
          ))}
          <form key={cal.selected} action={createLessonAction} className="aula-form-row is-lesson">
            <input type="hidden" name="day" value={cal.selected} />
            <label className="aula-label">
              С
              <TimeField name="startTime" value={startTime} onChange={onStart} />
            </label>
            <label className="aula-label">
              По
              <TimeField name="endTime" value={endTime} onChange={setEndTime} />
            </label>
            <AulaSelect
              name="studentId"
              label="Ученик"
              value={student}
              onChange={setStudent}
              options={students.map((s) => ({ value: s.id, label: s.name }))}
              required
            />
            <button className="btn btn-primary" type="submit">
              Создать
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
