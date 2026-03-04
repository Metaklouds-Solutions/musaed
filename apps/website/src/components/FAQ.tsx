"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/dictionaries";

const questions = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
] as const;

export default function FAQ({ dict }: { dict: Dictionary }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
      aria-labelledby="faq-heading"
    >
      <div className="floating-blob floating-blob-mint w-[300px] h-[300px] -top-20 right-1/4 animate-blob-drift" aria-hidden="true" />

      <div className="mx-auto max-w-3xl relative z-10">
        <h2
          id="faq-heading"
          className="type-h2 text-center font-bold gradient-text"
        >
          {dict.faq.heading}
        </h2>
        <dl className="mt-12 space-y-3">
          {questions.map((key, i) => {
            const q = dict.faq[key as keyof typeof dict.faq] as {
              question: string;
              answer: string;
            };
            const isOpen = openIndex === i;
            return (
              <div
                key={key}
                className={`glass-card overflow-hidden transition-all duration-300 ${isOpen ? "glass-card-strong" : ""}`}
              >
                <dt>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left text-base font-semibold text-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-[var(--lg-radius)] transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    id={`faq-question-${i}`}
                  >
                    {q.question}
                    <span
                      className={`ml-3 shrink-0 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
                        isOpen
                          ? "bg-gradient-to-br from-primary to-[#2ba3b8] text-white rotate-45"
                          : "bg-primary/10 text-primary"
                      }`}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                </dt>
                <dd
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-question-${i}`}
                  className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <p className="type-body px-6 pb-5 text-muted">{q.answer}</p>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
