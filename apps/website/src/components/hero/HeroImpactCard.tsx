"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

type Metric = {
  value: number;
  suffix: string;
  label: string;
};

const HeroAgentScene = dynamic(() => import("./HeroAgentScene"), {
  ssr: false,
  loading: () => null,
});

function CountUpMetric({ metric, start }: { metric: Metric; start: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  const normalizedLabel =
    metric.label.length > 0
      ? metric.label.charAt(0).toUpperCase() + metric.label.slice(1)
      : metric.label;

  useEffect(() => {
    if (!start) {
      return;
    }

    const durationMs = 1100;
    const startAt = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startAt) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(metric.value * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [metric.value, start]);

  return (
    <div className="glass-card-strong rounded-2xl p-3 text-left transition-all hover:scale-[1.02]">
      <p className="text-2xl font-bold hero-metric-value">
        {displayValue}
        {metric.suffix}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted">{normalizedLabel}</p>
    </div>
  );
}

export default function HeroImpactCard({
  title,
  metrics,
}: {
  title: string;
  metrics: Metric[];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);


  return (
    <div ref={cardRef} className="hero-card-float p-1 sm:p-2">
      <div className="glass-card inline-flex items-center gap-2 px-4 py-1.5 mb-3" style={{ borderRadius: "9999px" }}>
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-[0.14em] gradient-text">{title}</p>
      </div>
      <div className="relative h-[30rem] overflow-hidden rounded-2xl">
        <HeroAgentScene />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
        {metrics.map((metric) => (
          <CountUpMetric key={metric.label} metric={metric} start={isVisible} />
        ))}
      </div>
    </div>
  );
}
