import Link from "next/link";
import type { Dictionary } from "@/lib/dictionaries";
import HeroBackgroundLayer from "@/components/hero/HeroBackgroundLayer";
import HeroImpactCard from "@/components/hero/HeroImpactCard";
import HeroTicker from "@/components/hero/HeroTicker";

export default function Hero({ dict }: { dict: Dictionary }) {
  const metrics = [
    { value: 47, suffix: "+", label: dict.hero.liveCard.metric1 },
    { value: 100, suffix: "%", label: dict.hero.liveCard.metric2 },
    { value: 0, suffix: "", label: dict.hero.liveCard.metric3 },
  ];

  return (
    <>
      <section
        className="relative min-h-[90vh] overflow-hidden gradient-bg-hero px-4 pt-32 pb-24 sm:px-6 sm:pt-40 sm:pb-32 lg:px-8 lg:pt-44 lg:pb-36 -mt-[72px]"
        aria-labelledby="hero-heading"
      >
        <HeroBackgroundLayer />

        <div className="deco-ring w-72 h-72 -top-20 -right-20 opacity-25 animate-float-slow" aria-hidden="true" />
        <div className="deco-ring w-44 h-44 top-1/3 -left-14 opacity-20 animate-float-medium" aria-hidden="true" />

        <div className="mx-auto max-w-6xl relative z-10">
          <div className="grid items-center gap-16 lg:grid-cols-5 lg:gap-12">
            <div className="animate-fade-in-up lg:col-span-2">
              <div className="glass-card inline-flex items-center gap-2 px-4 py-2 mb-8" style={{ borderRadius: "9999px" }}>
                <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                <span className="text-sm font-medium text-foreground/80">{dict.hero.trustBadge}</span>
              </div>

              <h1
                id="hero-heading"
                className="type-h1 max-w-3xl font-bold tracking-tight text-foreground hero-headline-accent"
              >
                {dict.hero.headline}
              </h1>
              <p className="type-body-lg mt-6 max-w-2xl text-muted/90">
                {dict.hero.subheadline}
              </p>
              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  href="#final-cta"
                  className="btn-liquid inline-flex min-h-[48px] min-w-[200px] items-center justify-center px-8 py-3.5 text-base font-semibold text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  style={{ borderRadius: "9999px" }}
                >
                  {dict.hero.cta}
                </Link>
                <a
                  href="#how-it-works"
                  className="btn-liquid-ghost inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  style={{ borderRadius: "9999px" }}
                >
                  {dict.hero.anchor}
                  <span aria-hidden="true" className="text-lg">↓</span>
                </a>
              </div>
            </div>

            <div className="animate-fade-in-up lg:col-span-3" style={{ animationDelay: "120ms" }}>
              <HeroImpactCard
                title={dict.hero.liveCard.title}
                metrics={metrics}
              />
            </div>
          </div>
        </div>
      </section>
      <div className="section-glow-divider" />
      <HeroTicker
        items={[
          dict.hero.ticker.item1,
          dict.hero.ticker.item2,
          dict.hero.ticker.item3,
          dict.hero.ticker.item4,
        ]}
      />
    </>
  );
}
