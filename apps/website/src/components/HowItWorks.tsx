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
      className="relative overflow-hidden bg-background px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32"
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/20 pointer-events-none" aria-hidden="true" />
      <div className="deco-ring w-[400px] h-[400px] -top-32 left-1/2 -translate-x-1/2 opacity-10 animate-float-slow" aria-hidden="true" />
      <div className="deco-ring w-[260px] h-[260px] bottom-10 -right-14 opacity-10 animate-float-medium" aria-hidden="true" style={{ animationDelay: "-5s" }} />

      <div ref={ref} className="mx-auto max-w-6xl relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
          <h2
            id="how-it-works-heading"
            className={`type-h2 font-bold tracking-tight text-foreground hero-headline-accent transition-all duration-700 ${visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}
          >
            {dict.howItWorks.heading}
          </h2>
          <div className="mt-6 flex justify-center gap-2">
             <div className="w-8 h-1 bg-accent/20 rounded-full"></div>
             <div className="w-12 h-1 bg-accent/40 rounded-full"></div>
             <div className="w-8 h-1 bg-accent/20 rounded-full"></div>
          </div>
        </div>

        <div className="grid gap-y-12 gap-x-8 sm:grid-cols-2 lg:grid-cols-3 relative">
          {/* Connector line for large screens */}
          <div className="hidden lg:block absolute top-16 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-border/60 to-transparent -z-10" />

          {steps.map((step, i) => (
            <article
              key={i}
              className={`relative flex flex-col p-2 transition-all duration-300 hover:-translate-y-2 group ${visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}
              style={{ animationDelay: `${(i + 1) * 150}ms` }}
            >
              <div className="relative mx-auto mb-6">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-2xl bg-background border border-border/50 shadow-sm group-hover:border-accent/30 group-hover:shadow-accent/10 transition-all duration-300 z-20 relative"
                >
                  <span className="text-accent group-hover:scale-110 transition-transform duration-300">
                    <step.icon size={36} strokeWidth={1.5} />
                  </span>
                </div>
                
                {/* Number badge */}
                <div
                  className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-primary-foreground shadow-md z-30 ring-4 ring-background ltr:-right-3 ltr:-top-3 rtl:-left-3 rtl:-top-3"
                  aria-hidden="true"
                >
                  {i + 1}
                </div>
              </div>

              <div className="text-center glass-card flex-1 p-6 border border-border/50 bg-background/50 backdrop-blur-sm rounded-2xl hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
                <h3 className="type-h5 font-semibold text-foreground group-hover:text-accent transition-colors">
                  {step.title}
                </h3>
                <p className="type-body mt-4 text-muted-foreground leading-relaxed">
                  {step.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}