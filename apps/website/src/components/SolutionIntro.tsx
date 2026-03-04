import type { Dictionary } from "@/lib/dictionaries";
import { CalendarCheck2, PhoneCall, Sparkles } from "lucide-react";

export default function SolutionIntro({ dict }: { dict: Dictionary }) {
  return (
    <section
      className="relative overflow-hidden gradient-bg-soft px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
      aria-labelledby="solution-heading"
    >
      <div className="floating-blob floating-blob-teal w-[340px] h-[340px] top-0 right-0 animate-blob-drift" aria-hidden="true" />

      <div className="mx-auto max-w-4xl relative z-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2
              id="solution-heading"
              className="type-h2 font-bold gradient-text"
            >
              {dict.solution.heading}
            </h2>
            <p className="type-body mt-6 text-muted">
              {dict.solution.body}
            </p>
          </div>
          <div className="glass-card-strong flex items-center justify-center p-3 sm:p-4">
            <div className="solution-gradient-border relative h-52 w-full max-w-sm p-px transition-transform duration-300 hover:-translate-y-0.5">
              <div className="relative h-full w-full rounded-[calc(var(--lg-radius)-2px)] bg-gradient-to-br from-secondary/30 via-white/45 to-primary/5 p-4 sm:p-5">
                <div className="absolute inset-0 overflow-hidden rounded-[calc(var(--lg-radius)-2px)]">
                  <div
                    className="floating-blob floating-blob-mint h-28 w-28 top-2 left-3 animate-float-gentle"
                    aria-hidden="true"
                    style={{ filter: "blur(28px)" }}
                  />
                  <div
                    className="floating-blob floating-blob-teal h-24 w-24 bottom-3 right-3 animate-float-medium"
                    aria-hidden="true"
                    style={{ filter: "blur(24px)" }}
                  />
                </div>

                <div className="relative z-10 grid h-full grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="animate-float-gentle lg-surface rounded-2xl p-3">
                    <div className="flex items-center gap-2 text-primary">
                      <PhoneCall size={14} />
                      <span className="text-[11px] font-semibold uppercase tracking-wide">Call</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-primary/10">
                      <div className="h-full w-2/3 rounded-full bg-primary/50" />
                    </div>
                  </div>

                  <div className="relative flex items-center justify-center">
                    <span className="absolute h-10 w-10 rounded-full border border-primary/25" style={{ animation: "hero-pulse-ring 2.8s ease-out infinite" }} />
                    <span
                      className="absolute h-10 w-10 rounded-full border border-primary/20"
                      style={{ animation: "hero-pulse-ring 2.8s ease-out 0.9s infinite" }}
                    />
                    <span className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 border border-white/50 text-primary shadow-sm backdrop-blur-sm">
                      <Sparkles size={16} />
                    </span>
                  </div>

                  <div className="animate-float-medium lg-surface rounded-2xl p-3">
                    <div className="flex items-center gap-2 text-primary">
                      <CalendarCheck2 size={14} />
                      <span className="text-[11px] font-semibold uppercase tracking-wide">Booked</span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="h-1.5 w-5/6 rounded-full bg-primary/20" />
                      <div className="h-1.5 w-3/5 rounded-full bg-primary/15" />
                    </div>
                  </div>

                  <div className="absolute left-[29%] right-[29%] top-1/2 -translate-y-1/2" aria-hidden="true">
                    <div className="relative h-px bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0">
                      <span
                        className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-primary/45"
                        style={{ animation: "particle-drift-right 1.5s ease-out infinite" }}
                      />
                      <span
                        className="absolute -left-1 -top-1 h-1.5 w-1.5 rounded-full bg-primary/35"
                        style={{ animation: "particle-drift-right 1.5s ease-out 0.5s infinite" }}
                      />
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
