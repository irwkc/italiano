"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";

const KEY = "giacomo-cookie-consent";

type Consent = {
  necessary: true;
  analytics: boolean;
};

type Snap = Consent | "missing" | "pending";

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

function subscribeConsent(onStoreChange: () => void) {
  const onChange = () => onStoreChange();
  window.addEventListener("storage", onChange);
  window.addEventListener("giacomo-consent", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("giacomo-consent", onChange);
  };
}

function clientSnap(): Snap {
  return read() ?? "missing";
}

export function CookieBanner() {
  const stored = useSyncExternalStore(subscribeConsent, clientSnap, (): Snap => "pending");
  const [forcedOpen, setForcedOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const reopen = () => {
      const current = read();
      setAnalytics(current?.analytics ?? false);
      setCustomize(true);
      setForcedOpen(true);
    };
    window.addEventListener("giacomo-cookies", reopen);
    return () => window.removeEventListener("giacomo-cookies", reopen);
  }, []);

  if (stored === "pending") return null;
  const open = forcedOpen || stored === "missing";
  if (!open) return null;

  return (
    <aside className="cookie-bar" role="dialog" aria-labelledby="cookie-title" aria-describedby="cookie-text">
      <p id="cookie-title" className="cookie-title">
        Cookie
      </p>
      <p id="cookie-text" className="cookie-text">
        Нужны для работы сайта. Аналитика — только с вашего разрешения.{" "}
        <Link href="/legal/cookies" className="link">
          Политика
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
            setForcedOpen(false);
            setCustomize(false);
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
              setForcedOpen(false);
              setCustomize(false);
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
                setForcedOpen(false);
                setCustomize(false);
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
