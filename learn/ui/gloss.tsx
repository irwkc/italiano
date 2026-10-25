"use client";

import { useEffect, useRef, useState } from "react";
import { isWord, lookupGloss, splitWords } from "@/learn/gloss";

const cache = new Map<string, string>();

async function fetchGloss(word: string) {
  const key = word.toLocaleLowerCase("it-IT");
  const hit = cache.get(key);
  if (hit) return hit;
  const res = await fetch(`/aula/api/gloss?q=${encodeURIComponent(word)}`);
  if (!res.ok) return "нет перевода";
  const data = (await res.json()) as { text?: string };
  const text = data.text?.trim() || "нет перевода";
  cache.set(key, text);
  return text;
}

export function GlossText({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [meanings, setMeanings] = useState<Record<string, string>>({});
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function show(index: number, word: string) {
    if (open === index) {
      setOpen(null);
      return;
    }
    setOpen(index);
    if (meanings[word] || lookupGloss(word)) {
      const known = lookupGloss(word);
      if (known) setMeanings((m) => ({ ...m, [word]: known }));
      return;
    }
    void fetchGloss(word).then((text) => setMeanings((m) => ({ ...m, [word]: text })));
  }

  return (
    <span className={className} ref={root}>
      {splitWords(text).map((part, index) => {
        if (!isWord(part)) return <span key={`${part}-${index}`}>{part}</span>;
        const on = open === index;
        return (
          <span key={`${part}-${index}`} className="aula-word-wrap">
            <button type="button" className={`aula-word${on ? " is-on" : ""}`} onClick={() => show(index, part)}>
              {part}
            </button>
            {on ? (
              <span className="aula-gloss" role="tooltip">
                <span className="aula-gloss-it">{part}</span>
                <span className="aula-gloss-ru">{meanings[part] ?? lookupGloss(part) ?? "…"}</span>
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
