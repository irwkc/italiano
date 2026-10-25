export function formatLessonWhen(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayLong(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatDayKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function addHour(time: string) {
  const [h, m] = time.split(":").map(Number);
  const next = (h * 60 + (m || 0) + 60) % (24 * 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(next / 60))}:${pad(next % 60)}`;
}

export function formatTimeRange(startIso: string, endIso?: string) {
  const end = endIso ?? new Date(new Date(startIso).getTime() + 60 * 60 * 1000).toISOString();
  return `${formatTime(startIso)}–${formatTime(end)}`;
}

export function formatMonth(year: number, month: number) {
  const name = new Date(year, month, 1).toLocaleDateString("ru-RU", { month: "long" });
  return `${name} ${year}`;
}

export function dayKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function lessonDayKey(iso: string) {
  return dayKey(new Date(iso));
}

export function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function timeFromIso(iso: string) {
  return toLocalInput(iso).slice(11, 16);
}

export function studentPath(token: string, suffix = "") {
  return `/aula/s/${token}${suffix}`;
}
