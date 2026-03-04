"use client";

import type { Dictionary } from "@/lib/dictionaries";
import { Plug, Rocket, SlidersHorizontal } from "lucide-react";
import { useInView } from "@/hooks/useInView";

export default function HowItWorks({ dict }: { dict: Dictionary }) {
  const { ref, visible } = useInView(0.15);

  const steps = [
    { title: dict.howItWorks.step1.title, body: dict.howItWorks.step1.body, icon: Plug },
    {
      title: dict.howItWorks.step2.title,
      body: dict.howItWorks.step2.body,
      icon: SlidersHorizontal,
    },
    { title: dict.howItWorks.step3.title, body: dict.howItWorks.step3.body, icon: Rocket },
  ];

  return (
    <section
      className="relative overflow-hidden gradient-bg-dark px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
    >
      <div className="floating-blob floating-blob-gold w-[340px] h-[340px] -top-20 left-1/2 animate-blob-drift" aria-hidden="true" />
      <div className="floating-blob floating-blob-mint w-[260px] h-[260px] bottom-0 -right-14 animate-blob-drift" aria-hidden="true" style={{ animationDelay: "-5s" }} />

      <div ref={ref} className="mx-auto max-w-6xl relative z-10">
        <h2
          id="how-it-works-heading"
          className="type-h2 text-center font-bold text-white"
        >
          {dict.howItWorks.heading}
        </h2>
        <div className="mt-20 grid gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => (
            <article
              key={i}
              className={`glass-card relative flex flex-col p-8 pt-10 transition-all duration-300 hover:scale-[1.02] ${visible ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div
                className="absolute left-8 -top-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#d4a05a] text-xl font-bold text-[#0c2a2f] shadow-[0_6px_18px_rgba(228,185,128,0.35)] z-20 ltr:left-8 rtl:right-8 rtl:left-auto"
                aria-hidden="true"
              >
                {i + 1}
              </div>
              <h3 className="type-h4 mt-4 font-semibold text-white">
                {step.title}
              </h3>
              <span className="icon-gradient mt-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-secondary">
                <step.icon size={22} strokeWidth={2} />
              </span>
              <p className="type-body mt-4 flex-1 text-white/70">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
