"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { ScriptWrite } from "@/components/script-write";
import { contact, site } from "@/lib/content";

type Status = "idle" | "sending" | "sent";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<{ name?: string; handle?: string; consent?: string }>({});

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const handle = String(data.get("handle") ?? "").trim();
    const next: typeof errors = {};
    if (!name) next.name = "Как к вам обращаться?";
    if (!handle) next.handle = "Нужен Telegram или почта, чтобы ответить.";
    if (!data.get("consent")) next.consent = "Нужно согласие на обработку данных.";
    setErrors(next);
    if (Object.keys(next).length) return;

    // MOCK: здесь будет отправка (Telegram-бот, почта или форма).
    setStatus("sending");
    window.setTimeout(() => setStatus("sent"), 900);
  }

  return (
    <section id="contatti" className="relative px-5 md:px-10 pt-14 md:pt-[14vh] pb-[max(7.5rem,calc(16vh+env(safe-area-inset-bottom)))] md:pb-[max(9.5rem,calc(22vh+env(safe-area-inset-bottom)))] overflow-x-clip" aria-label="Контакты">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 items-start">
        <div className="lg:col-span-5 order-2 lg:order-1 mt-8 lg:mt-0">
          <h2 className="reveal serif text-[1.7rem] md:text-[2.5rem] leading-[1.05]">{contact.title}</h2>
          <p className="reveal mt-3 md:mt-4 text-ink-soft text-[0.9rem] md:text-base leading-relaxed max-w-[26rem]">{contact.body}</p>

          {status === "sent" ? (
            <p className="mt-12 serif italic text-[1.6rem] md:text-[2rem] text-pompei" role="status">
              {contact.success}
            </p>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-12 grid gap-8 max-w-[30rem]">
              <div className="grid gap-2">
                <label htmlFor="name" className="label">
                  Имя
                </label>
                <input
                  id="name"
                  name="name"
                  className="field"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-err" : undefined}
                />
                {errors.name && (
                  <p id="name-err" className="text-pompei text-sm">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor="handle" className="label">
                  Telegram или почта
                </label>
                <input
                  id="handle"
                  name="handle"
                  className="field"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.handle)}
                  aria-describedby={errors.handle ? "handle-err" : undefined}
                />
                {errors.handle && (
                  <p id="handle-err" className="text-pompei text-sm">
                    {errors.handle}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor="goal" className="label">
                  Зачем вам итальянский
                </label>
                <textarea id="goal" name="goal" rows={2} className="field resize-none" />
              </div>
              <label className="cookie-opt contact-consent">
                <input type="checkbox" name="consent" value="yes" />
                <span>
                  Согласен на обработку персональных данных по{" "}
                  <a href="/legal/privacy" className="link">
                    политике
                  </a>
                </span>
              </label>
              {errors.consent ? <p className="text-pompei text-sm">{errors.consent}</p> : null}
              <button type="submit" className="btn btn-primary justify-self-start" disabled={status === "sending"}>
                {status === "sending" ? "Отправляю" : site.cta}
                <ArrowRight size={14} weight="light" />
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-7 order-1 lg:order-2 lg:flex lg:justify-end max-lg:overflow-x-clip">
          <ScriptWrite
            text={contact.script}
            data-menu-word="Scrivimi"
            className="text-pompei whitespace-nowrap max-lg:max-w-full lg:shrink-0 lg:-translate-x-[14vw]"
            style={{ fontSize: "clamp(3.2rem, 18vw, 22rem)" }}
          />
        </div>
      </div>
    </section>
  );
}
