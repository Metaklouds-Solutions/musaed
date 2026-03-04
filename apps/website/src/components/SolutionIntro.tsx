"use client";

import type { Dictionary } from "@/lib/dictionaries";
import { CalendarCheck2, Clock, Globe, MessageSquare, PhoneCall, Sparkles, ArrowRight } from "lucide-react";
import { useInView } from "@/hooks/useInView";

export default function SolutionIntro({ dict }: { dict: Dictionary }) {
  const { ref, visible } = useInView(0.1);

  return (
    <section
      className="relative overflow-hidden gradient-bg-soft px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36"
      aria-labelledby="solution-heading"
    >
      <div className="floating-blob floating-blob-teal w-[400px] h-[400px] -top-20 -right-20 animate-blob-drift" aria-hidden="true" />
      <div className="floating-blob floating-blob-mint w-[300px] h-[300px] bottom-0 -left-20 animate-blob-drift" aria-hidden="true" style={{ animationDelay: "-5s" }} />

      <div ref={ref} className="mx-auto max-w-6xl relative z-10">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20 items-center">
          {/* Left — Text + CTA */}
          <div className={`transition-all duration-700 ${visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}>
            <h2
              id="solution-heading"
              className="type-h2 font-bold gradient-text"
            >
              {dict.solution.heading}
            </h2>
            <p className="type-body-lg mt-6 text-muted leading-relaxed max-w-lg">
              {dict.solution.body}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mt-8">
              {[
                { icon: Clock, label: "24/7 Availability" },
                { icon: Globe, label: "Arabic & English" },
                { icon: MessageSquare, label: "Smart Replies" },
              ].map((pill, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-primary/10 backdrop-blur-sm shadow-sm text-sm text-foreground/80"
                >
                  <pill.icon size={14} className="text-primary" strokeWidth={2} />
                  {pill.label}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#final-cta"
                className="btn-liquid inline-flex items-center gap-2 px-7 py-3.5 text-white font-semibold text-sm"
              >
                {dict.hero.cta}
                <ArrowRight size={16} strokeWidth={2.5} />
              </a>
              <a
                href="#how-it-works"
                className="btn-liquid-ghost inline-flex items-center gap-2 px-7 py-3.5 text-primary font-semibold text-sm"
              >
                {dict.hero.anchor}
              </a>
            </div>
          </div>

          {/* Right — Visual */}
          <div
            className={`transition-all duration-700 ${visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}
            style={{ animationDelay: "200ms" }}
          >
            <div className="glass-card-strong p-5 sm:p-6">
              <div className="solution-gradient-border relative w-full p-px">
                <div className="relative w-full rounded-[calc(var(--lg-radius)-2px)] bg-gradient-to-br from-secondary/20 via-white/50 to-primary/5 p-6 sm:p-8">
                  {/* Background blobs */}
                  <div className="absolute inset-0 overflow-hidden rounded-[calc(var(--lg-radius)-2px)]">
                    <div className="floating-blob floating-blob-mint h-32 w-32 top-0 left-4 animate-float-gentle" aria-hidden="true" style={{ filter: "blur(30px)" }} />
                    <div className="floating-blob floating-blob-teal h-28 w-28 bottom-4 right-4 animate-float-medium" aria-hidden="true" style={{ filter: "blur(26px)" }} />
                  </div>

                  {/* Flow diagram: Call → AI → Booked */}
                  <div className="relative z-10 flex flex-col gap-5">
                    {/* Row 1: Incoming call */}
                    <div className="flex items-center gap-4">
                      <div className="animate-float-gentle lg-surface rounded-2xl p-4 flex-1">
                        <div className="flex items-center gap-2 text-primary">
                          <PhoneCall size={16} />
                          <span className="text-xs font-semibold uppercase tracking-wide">Incoming Call</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">P</div>
                          <div>
                            <div className="text-xs font-medium text-foreground/80">Patient calling...</div>
                            <div className="text-[10px] text-muted">+966 5X XXX XXXX</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Arrow + AI core */}
                    <div className="flex items-center justify-center gap-3 px-4">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-primary/30" />
                      <div className="relative flex items-center justify-center">
                        <span className="absolute h-12 w-12 rounded-full border border-primary/20" style={{ animation: "hero-pulse-ring 3s ease-out infinite" }} />
                        <span className="absolute h-12 w-12 rounded-full border border-primary/15" style={{ animation: "hero-pulse-ring 3s ease-out 1s infinite" }} />
                        <span className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 border border-white/60 text-primary shadow-md backdrop-blur-sm">
                          <Sparkles size={18} />
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-primary/30 via-primary/20 to-transparent" />
                    </div>

                    {/* Row 2: Results */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="animate-float-gentle lg-surface rounded-2xl p-4" style={{ animationDelay: "-1s" }}>
                        <div className="flex items-center gap-2 text-primary">
                          <CalendarCheck2 size={14} />
                          <span className="text-[10px] font-semibold uppercase tracking-wide">Booked</span>
                        </div>
                        <div className="mt-2 text-xs font-medium text-foreground/70">Dr. Ahmed — Thu 3PM</div>
                        <div className="mt-1.5 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          <span className="text-[10px] text-green-600 font-medium">Confirmed</span>
                        </div>
                      </div>
                      <div className="animate-float-medium lg-surface rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-primary">
                          <MessageSquare size={14} />
                          <span className="text-[10px] font-semibold uppercase tracking-wide">SMS Sent</span>
                        </div>
                        <div className="mt-2 text-xs font-medium text-foreground/70">Reminder scheduled</div>
                        <div className="mt-1.5 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                          <span className="text-[10px] text-primary font-medium">Auto-reminder</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
