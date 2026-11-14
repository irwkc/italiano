"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "giacomo-cookie-consent";

type Consent = {
  necessary: true;
  analytics: boolean;
};

function read(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Consent>;
    if (parsed.necessary !== true) return null;
    return { necessary: true, analytics: Boolean(parsed.analytics) };
  } catch {
    return null;
  }
}

function save(consent: Consent) {
  localStorage.setItem(KEY, JSON.stringify({ ...consent, at: Date.now() }));
  window.dispatchEvent(new Event("giacomo-consent"));
}

export function CookieBanner() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const existing = read();
    setOpen(!existing);
    setAnalytics(existing?.analytics ?? false);
    setReady(true);
    const reopen = () => {
      const current = read();
      setAnalytics(current?.analytics ?? false);
      setCustomize(true);
      setOpen(true);
    };
    window.addEventListener("giacomo-cookies", reopen);
    return () => window.removeEventListener("giacomo-cookies", reopen);
  }, []);

  if (!ready || !open) return null;

  return (
    <aside className="cookie-bar" role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-text">
      <p id="cookie-title" className="cookie-title">
        Cookie
      </p>
      <p id="cookie-text" className="cookie-text">
        Нужны для сайта. Аналитика — только с разрешения.{" "}
        <Link href="/legal/cookies" className="link">
          Подробнее
        </Link>
      </p>
      {customize ? (
        <div className="cookie-opts">
          <label className="cookie-opt">
            <input type="checkbox" checked disabled />
            Необходимые
          </label>
          <label className="cookie-opt">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(event) => setAnalytics(event.target.checked)}
            />
            Аналитические
          </label>
        </div>
      ) : null}
      <div className="cookie-actions">
        <button
          type="button"
          className="cookie-btn"
          onClick={() => {
            save({ necessary: true, analytics: false });
            setOpen(false);
          }}
        >
          Нужные
        </button>
        {customize ? (
          <button
            type="button"
            className="cookie-btn cookie-btn-on"
            onClick={() => {
              save({ necessary: true, analytics });
              setOpen(false);
            }}
          >
            Ок
          </button>
        ) : (
          <>
            <button type="button" className="cookie-btn" onClick={() => setCustomize(true)}>
              Выбор
            </button>
            <button
              type="button"
              className="cookie-btn cookie-btn-on"
              onClick={() => {
                save({ necessary: true, analytics: true });
                setOpen(false);
              }}
            >
              Все
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

export function CookieSettingsLink() {
  return (
    <button
      type="button"
      className="link cookie-settings"
      onClick={() => window.dispatchEvent(new Event("giacomo-cookies"))}
    >
      Настройки cookie
    </button>
  );
}
