"use client";

import { useRouter } from "next/navigation";
import { formatLessonWhen, studentPath } from "@/learn/format";
import type { Lesson } from "@/learn/types";
import { AulaSelect } from "@/learn/ui/select";

export function CompitiFilter({
  token,
  lessons,
  current,
}: {
  token: string;
  lessons: Lesson[];
  current?: string;
}) {
  const router = useRouter();

  return (
    <div className="aula-filter">
      <AulaSelect
        label="Занятие"
        value={current ?? ""}
        onChange={(id) => {
          router.push(`${studentPath(token, "/compiti")}?lezione=${encodeURIComponent(id)}`);
        }}
        options={lessons.map((lesson) => ({
          value: lesson.id,
          label: `${lesson.title} · ${formatLessonWhen(lesson.startsAt)}`,
        }))}
      />
    </div>
  );
}
