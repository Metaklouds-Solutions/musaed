"use client";

import type { Dictionary } from "@/lib/dictionaries";
import { CalendarX, PhoneOff, Users } from "lucide-react";
import { useInView } from "@/hooks/useInView";

export default function ProblemAgitation({ dict }: { dict: Dictionary }) {
  const { ref, visible } = useInView(0.08);

  const points = [
    { title: dict.problem.card1.title, body: dict.problem.card1.body, icon: PhoneOff },
    { title: dict.problem.card2.title, body: dict.problem.card2.body, icon: Users },
    { title: dict.problem.card3.title, body: dict.problem.card3.body, icon: CalendarX },
  ];

  return (
    <section
      className="relative overflow-hidden px-4 pt-24 pb-20 sm:px-6 sm:pt-32 sm:pb-28 lg:px-8 lg:pt-40 lg:pb-36"
      aria-labelledby="problem-heading"
      style={{ background: "#fdfdfd" }}
    >
      {/* Grid background — fades in from top */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(220,38,38,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.06) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
          }}
        />
        {/* Large faint red radial wash */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(220,38,38,0.06) 0%, transparent 70%)" }}
        />
        {/* Dot accent */}
        <div
          className="absolute top-[20%] right-[12%] w-2 h-2 rounded-full bg-red-400/30 animate-pulse"
        />
        <div
          className="absolute top-[55%] left-[8%] w-1.5 h-1.5 rounded-full bg-red-400/20 animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div ref={ref} className="mx-auto max-w-5xl relative z-10">
        {/* Heading */}
        <div
          className={`text-center mb-20 lg:mb-28 transition-all duration-700 ${
            visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"
          }`}
        >
          <h2
            id="problem-heading"
            className="type-h2 font-bold tracking-tight text-foreground max-w-3xl mx-auto"
          >
            {dict.problem.heading}
          </h2>
          <div className="mt-6 mx-auto w-10 h-[3px] rounded-full bg-red-400/60" />
        </div>

        {/* Pain points — timeline strip */}
        <div className="relative">
          {/* Vertical connector line */}
          <div
            className="absolute left-6 sm:left-8 top-0 bottom-0 w-px hidden lg:block"
            style={{
              background: "linear-gradient(to bottom, rgba(220,38,38,0.18), rgba(220,38,38,0.04))",
            }}
            aria-hidden="true"
          />

          <div className="space-y-16 lg:space-y-20">
            {points.map((point, i) => (
              <div
                key={i}
                className={`relative grid lg:grid-cols-[56px_1fr] gap-6 lg:gap-10 items-start transition-all duration-700 ${
                  visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"
                }`}
                style={{ animationDelay: `${200 + i * 180}ms` }}
              >
                {/* Timeline node */}
                <div className="hidden lg:flex flex-col items-center" aria-hidden="true">
                  <div className="relative">
                    <span className="absolute -inset-2 rounded-full bg-red-400/10 animate-ping opacity-30" style={{ animationDuration: "3s", animationDelay: `${i * 0.8}s` }} />
                    <div className="relative w-12 h-12 rounded-full border-2 border-red-300/40 bg-white flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.08)]">
                      <point.icon size={20} className="text-red-400" strokeWidth={1.8} />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="group">
                  {/* Mobile icon */}
                  <div className="lg:hidden mb-4 inline-flex w-11 h-11 rounded-full border-2 border-red-300/40 bg-white items-center justify-center shadow-sm">
                    <point.icon size={18} className="text-red-400" strokeWidth={1.8} />
                  </div>

                  <h3 className="type-h4 font-semibold text-foreground mb-3 group-hover:text-red-500 transition-colors duration-300">
                    {point.title}
                  </h3>
                  <p className="type-body-lg text-muted max-w-xl leading-relaxed">
                    {point.body}
                  </p>

                  {/* Subtle underline accent */}
                  <div className="mt-5 w-16 h-px bg-gradient-to-r from-red-300/50 to-transparent" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
