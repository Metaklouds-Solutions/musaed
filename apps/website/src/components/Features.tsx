"use client";

import type { Dictionary } from "@/lib/dictionaries";
import {
  BellRing,
  CalendarCheck2,
  Languages,
  LayoutDashboard,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import { useInView } from "@/hooks/useInView";

export default function Features({ dict }: { dict: Dictionary }) {
  const { ref, visible } = useInView(0.1);

  const features = [
    { title: dict.features.feature1.title, body: dict.features.feature1.body, icon: PhoneCall },
    {
      title: dict.features.feature2.title,
      body: dict.features.feature2.body,
      icon: CalendarCheck2,
    },
    { title: dict.features.feature3.title, body: dict.features.feature3.body, icon: BellRing },
    { title: dict.features.feature4.title, body: dict.features.feature4.body, icon: Languages },
    {
      title: dict.features.feature5.title,
      body: dict.features.feature5.body,
      icon: LayoutDashboard,
    },
    { title: dict.features.feature6.title, body: dict.features.feature6.body, icon: ShieldCheck },
  ];

  return (
    <section
      className="relative overflow-hidden gradient-bg-soft px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
      aria-labelledby="features-heading"
    >
      <div className="floating-blob floating-blob-mint w-[400px] h-[400px] -top-24 -right-20 animate-blob-drift" aria-hidden="true" />
      <div className="floating-blob floating-blob-teal w-[280px] h-[280px] bottom-0 -left-16 animate-blob-drift" aria-hidden="true" style={{ animationDelay: "-5s" }} />

      <div ref={ref} className="mx-auto max-w-6xl relative z-10">
        <h2
          id="features-heading"
          className="type-h2 text-center font-bold gradient-text"
        >
          {dict.features.heading}
        </h2>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <article
              key={i}
              className={`glass-card p-6 transition-all duration-300 hover:scale-[1.02] group ${visible ? "animate-fade-in-up" : "opacity-0"}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="icon-gradient inline-flex h-12 w-12 items-center justify-center rounded-2xl text-primary">
                <feature.icon size={22} strokeWidth={2} />
              </span>
              <h3 className="type-h5 mt-5 font-semibold text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="type-body mt-3 text-muted">{feature.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
