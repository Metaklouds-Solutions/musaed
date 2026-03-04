"use client";

import type { Dictionary } from "@/lib/dictionaries";
import { Plug, Rocket, SlidersHorizontal, CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { useInView } from "@/hooks/useInView";

export default function HowItWorks({ dict }: { dict: Dictionary }) {
  const { ref, visible } = useInView(0.1);

  const steps = [
    { title: dict.howItWorks.step1.title, body: dict.howItWorks.step1.body, icon: Plug, color: "primary" as const },
    { title: dict.howItWorks.step2.title, body: dict.howItWorks.step2.body, icon: SlidersHorizontal, color: "primary" as const },
    { title: dict.howItWorks.step3.title, body: dict.howItWorks.step3.body, icon: Rocket, color: "accent" as const },
  ];

  return (
    <section
      className="relative overflow-hidden bg-background px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36"
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
    >
      {/* Background layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(31,122,140,0.4) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(31,122,140,0.4) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating blobs */}
        <div
          className="floating-blob floating-blob-mint w-[450px] h-[450px] -top-32 -right-20 animate-blob-drift opacity-40"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="floating-blob floating-blob-teal w-[400px] h-[400px] top-1/3 -left-32 animate-blob-drift opacity-30"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="floating-blob floating-blob-gold w-[350px] h-[350px] bottom-16 right-1/4 animate-blob-drift opacity-30"
          style={{ animationDelay: "-8s" }}
        />
        <div
          className="floating-blob floating-blob-mint w-[300px] h-[300px] bottom-1/4 left-1/3 animate-blob-drift opacity-25"
          style={{ animationDelay: "-3s" }}
        />

        {/* Geometric shapes */}
        <div className="absolute top-20 left-[10%] w-20 h-20 border border-primary/10 rounded-xl rotate-12 animate-float-slow" />
        <div className="absolute top-[40%] right-[8%] w-16 h-16 border border-accent/10 rounded-full animate-float-medium" style={{ animationDelay: "-4s" }} />
        <div className="absolute bottom-24 left-[15%] w-14 h-14 border border-primary/8 rounded-lg rotate-45 animate-float-slow" style={{ animationDelay: "-7s" }} />
        <div className="absolute bottom-[35%] right-[18%] w-10 h-10 border border-accent/8 rounded-xl -rotate-12 animate-float-medium" style={{ animationDelay: "-2s" }} />
        <div className="absolute top-[60%] left-[5%] w-6 h-6 rounded-full bg-primary/[0.06] animate-float-slow" style={{ animationDelay: "-9s" }} />
        <div className="absolute top-12 right-[25%] w-8 h-8 rounded-full bg-accent/[0.05] animate-float-medium" style={{ animationDelay: "-6s" }} />
      </div>

      <div ref={ref} className="mx-auto max-w-5xl relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
          <h2
            id="how-it-works-heading"
            className={`type-h2 font-bold tracking-tight text-foreground hero-headline-accent transition-all duration-700 ${visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}
          >
            {dict.howItWorks.heading}
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Progress track — desktop */}
          <div className="hidden lg:block absolute top-[60px] left-[60px] right-[60px] h-1 rounded-full bg-border/30 z-0" aria-hidden="true">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-primary via-primary to-accent transition-all duration-[1.5s] ease-out ${visible ? "w-full" : "w-0"}`}
              style={{ transitionDelay: "600ms" }}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-12 lg:gap-8 relative z-10">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`relative transition-all duration-700 ${visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}
                style={{ animationDelay: `${200 + i * 200}ms` }}
              >
                {/* Step node */}
                <div className="flex flex-col items-center text-center">
                  {/* Circle with number + icon */}
                  <div className="relative mb-8">
                    <div className={`w-[120px] h-[120px] rounded-full flex items-center justify-center border-2 ${
                      i === 2
                        ? "border-accent/40 bg-background"
                        : "border-primary/30 bg-background"
                    } shadow-lg transition-all duration-300 group hover:scale-105 hover:shadow-xl`}>
                      <step.icon size={40} strokeWidth={1.4} className={i === 2 ? "text-accent" : "text-primary"} />
                    </div>
                    {/* Number badge */}
                    <div className={`absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ring-4 ring-background ${
                      i === 2 ? "bg-accent" : "bg-primary"
                    }`}>
                      {i + 1}
                    </div>
                    {/* Checkmark for completed feel on step 3 */}
                    {i === 2 && (
                      <div className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-md ring-2 ring-background">
                        <CheckCircle2 size={16} className="text-white" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>

                  {/* Arrow between steps — mobile */}
                  {i < 2 && (
                    <div className="lg:hidden flex justify-center my-2 text-primary/30">
                      <svg width="2" height="32" viewBox="0 0 2 32">
                        <line x1="1" y1="0" x2="1" y2="32" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                      </svg>
                    </div>
                  )}

                  {/* Text */}
                  <h3 className={`type-h5 font-semibold mb-3 ${i === 2 ? "text-accent" : "text-foreground"}`}>
                    {step.title}
                  </h3>
                  <p className="type-body text-muted max-w-xs leading-relaxed">
                    {step.body}
                  </p>
                </div>

                {/* Arrow connector — desktop, between steps */}
                {i < 2 && (
                  <div className="hidden lg:flex absolute top-[60px] -right-4 translate-x-1/2 -translate-y-1/2 items-center justify-center z-20" aria-hidden="true">
                    <div className="w-8 h-8 rounded-full bg-white border border-border/40 shadow-sm flex items-center justify-center">
                      <ArrowRight size={14} className="text-primary/60" strokeWidth={2.5} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vertical connector from steps to outcome */}
        <div
          className={`flex flex-col items-center transition-all duration-700 ${visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}
          style={{ animationDelay: "800ms" }}
          aria-hidden="true"
        >
          <svg width="2" height="48" viewBox="0 0 2 48" className="text-border/50 mt-4">
            <line x1="1" y1="0" x2="1" y2="48" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" />
          </svg>
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-primary/40 bg-background flex items-center justify-center shadow-sm">
            <ArrowRight size={16} className="text-primary/50 rotate-90" strokeWidth={2.5} />
          </div>
        </div>

        {/* Outcome — what you'll unlock */}
        <div
          className={`mt-4 transition-all duration-700 ${visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}
          style={{ animationDelay: "1000ms" }}
        >
          <div className="glass-card-strong how-it-works-outcome p-8 sm:p-10">

            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">What you&apos;ll unlock</p>
              <h3 className="type-h4 font-bold text-foreground">Start today. Your clinic never misses a call again.</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-background/70 border border-border/30">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-primary" strokeWidth={2} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-foreground">Zero missed calls</div>
                  <div className="text-xs text-muted">From day one</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-background/70 border border-border/30">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                  <Rocket size={18} className="text-primary" strokeWidth={2} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-foreground">Live in 48 hours</div>
                  <div className="text-xs text-muted">No technical setup</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-background/70 border border-border/30">
                <div className="w-9 h-9 rounded-full bg-accent/10 flex-shrink-0 flex items-center justify-center">
                  <Zap size={18} className="text-accent" strokeWidth={2} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-foreground">2,000+ SAR recovered</div>
                  <div className="text-xs text-muted">Per month in patient value</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <a
                href="#final-cta"
                className="btn-liquid inline-flex items-center gap-2 px-10 py-4 text-white font-semibold"
              >
                {dict.hero.cta}
                <ArrowRight size={18} strokeWidth={2} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}