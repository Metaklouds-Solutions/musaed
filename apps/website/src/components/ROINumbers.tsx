"use client";

import type { Dictionary } from "@/lib/dictionaries";
import { useInView } from "@/hooks/useInView";

export default function ROINumbers({ dict }: { dict: Dictionary }) {
  const { ref, visible } = useInView(0.15);

  const stats = [
    { value: dict.roi.stat1.value, label: dict.roi.stat1.label },
    { value: dict.roi.stat2.value, label: dict.roi.stat2.label },
    { value: dict.roi.stat3.value, label: dict.roi.stat3.label },
    { value: dict.roi.stat4.value, label: dict.roi.stat4.label },
  ];

  return (
    <section
      className="relative overflow-hidden gradient-bg-accent px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
      aria-labelledby="roi-heading"
    >
      <div className="floating-blob floating-blob-mint w-[400px] h-[400px] -top-24 left-1/3 animate-blob-drift" aria-hidden="true" />
      <div className="floating-blob floating-blob-gold w-[240px] h-[240px] bottom-0 right-10 animate-blob-drift" aria-hidden="true" style={{ animationDelay: "-4s" }} />

      <div ref={ref} className="mx-auto max-w-6xl relative z-10">
        <h2
          id="roi-heading"
          className="type-h2 text-center font-bold gradient-text"
        >
          {dict.roi.heading}
        </h2>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`glass-card-strong p-6 text-center transition-all duration-300 hover:scale-[1.03] ${visible ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <p className="type-h3 font-bold gradient-text">
                {stat.value}
              </p>
              <p className="type-caption mt-3 font-medium text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="type-body-lg mt-14 text-center font-medium text-foreground">
          {dict.roi.closing}
        </p>
      </div>
    </section>
  );
}
