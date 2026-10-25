"use client";

import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 1600);
    } catch {
      setDone(false);
    }
  }

  return (
    <div className="aula-copy">
      <code>{url}</code>
      <button type="button" className="btn" onClick={copy}>
        {done ? "Скопировано" : "Копировать ссылку"}
      </button>
    </div>
  );
}
