"use client";

import type { Dictionary } from "@/lib/dictionaries";
import { CalendarX, PhoneOff, Users } from "lucide-react";
import { useInView } from "@/hooks/useInView";

export default function ProblemAgitation({ dict }: { dict: Dictionary }) {
  const { ref, visible } = useInView(0.15);

  const cards = [
    { title: dict.problem.card1.title, body: dict.problem.card1.body, icon: PhoneOff },
    { title: dict.problem.card2.title, body: dict.problem.card2.body, icon: Users },
    { title: dict.problem.card3.title, body: dict.problem.card3.body, icon: CalendarX },
  ];

  return (
    <section
      className="relative overflow-hidden gradient-bg-dark px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
      aria-labelledby="problem-heading"
    >
      {/* Depth layers */}
      <div className="floating-blob floating-blob-gold w-[400px] h-[400px] -top-28 right-5 animate-blob-drift" aria-hidden="true" />
      <div className="floating-blob floating-blob-mint w-[300px] h-[300px] bottom-5 -left-20 animate-blob-drift" aria-hidden="true" style={{ animationDelay: "-3s" }} />
      <div className="floating-blob floating-blob-teal w-[260px] h-[260px] top-1/3 right-1/4 animate-blob-drift" aria-hidden="true" style={{ animationDelay: "-6s" }} />
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" aria-hidden="true" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "200px 200px" }} />
      {/* Grid pattern for depth */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden="true" style={{ backgroundImage: "linear-gradient(rgba(199,237,230,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(199,237,230,0.5) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <div ref={ref} className="mx-auto max-w-6xl relative z-10">
        <h2
          id="problem-heading"
          className="type-h2 text-center font-bold text-white"
        >
          {dict.problem.heading}
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <article
              key={i}
              className={`glass-card border-l-4 border-l-accent/50 p-6 transition-all duration-300 hover:scale-[1.02] group ${visible ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <span className="icon-gradient inline-flex h-12 w-12 items-center justify-center rounded-2xl text-accent">
                <card.icon size={22} strokeWidth={2} />
              </span>
              <h3 className="type-h5 mt-5 font-semibold text-white group-hover:text-accent transition-colors">{card.title}</h3>
              <p className="type-body mt-3 text-white/70">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
