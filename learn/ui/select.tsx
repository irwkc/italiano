"use client";

import { useEffect, useRef, useState } from "react";

export type AulaOption = { value: string; label: string };

export function AulaSelect({
  name,
  label,
  value,
  options,
  onChange,
  required,
}: {
  name?: string;
  label?: string;
  value: string;
  options: AulaOption[];
  onChange?: (value: string) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="aula-pick" ref={root}>
      {label ? <span className="aula-label">{label}</span> : null}
      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}
      <button
        type="button"
        className={`aula-pick-btn${open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{current?.label ?? "—"}</span>
      </button>
      {open ? (
        <ul className="aula-pick-list" role="listbox">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={option.value === value ? "is-on" : ""}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange?.(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
