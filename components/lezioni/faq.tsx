"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { faq } from "@/lib/content";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative px-5 md:px-10 py-[14vh]" aria-label="Вопросы">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6">
        <h2 className="reveal md:col-span-4 serif text-[1.5rem] md:text-[1.9rem] text-ink-soft mb-10 md:mb-0">
          Domande
        </h2>
        <ul className="md:col-span-7 md:col-start-6 border-t border-line">
          {faq.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q} className="reveal border-b border-line">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-start justify-between gap-6 py-6 text-left"
                >
                  <span className="serif text-[1.35rem] md:text-[1.75rem] leading-[1.15]">{item.q}</span>
                  <Plus
                    size={20}
                    weight="light"
                    className={`mt-2 shrink-0 transition-transform duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                <div
                  id={`faq-${i}`}
                  className="grid transition-[grid-template-rows] duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)]"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-7 text-ink-soft text-[0.95rem] md:text-base leading-relaxed max-w-[38rem]">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
