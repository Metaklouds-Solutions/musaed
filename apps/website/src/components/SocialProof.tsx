import type { Dictionary } from "@/lib/dictionaries";

export default function SocialProof({ dict }: { dict: Dictionary }) {
  const testimonials = [
    {
      quote: dict.socialProof.testimonial1.quote,
      author: dict.socialProof.testimonial1.author,
      role: dict.socialProof.testimonial1.role,
    },
    {
      quote: dict.socialProof.testimonial2.quote,
      author: dict.socialProof.testimonial2.author,
      role: dict.socialProof.testimonial2.role,
    },
    {
      quote: dict.socialProof.testimonial3.quote,
      author: dict.socialProof.testimonial3.author,
      role: dict.socialProof.testimonial3.role,
    },
  ];

  return (
    <section
      className="relative overflow-hidden bg-background px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
      aria-labelledby="testimonials-heading"
    >
      {/* Background layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(rgba(31,122,140,0.4) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(31,122,140,0.4) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Floating blobs */}
        <div className="floating-blob floating-blob-teal w-[400px] h-[400px] -top-24 -left-20 animate-blob-drift opacity-35" />
        <div className="floating-blob floating-blob-gold w-[300px] h-[300px] bottom-10 right-0 animate-blob-drift opacity-30" style={{ animationDelay: "-6s" }} />
        <div className="floating-blob floating-blob-mint w-[350px] h-[350px] top-1/2 right-1/4 animate-blob-drift opacity-25" style={{ animationDelay: "-3s" }} />

        {/* Geometric shapes */}
        <div className="absolute top-16 right-[12%] w-16 h-16 border border-primary/10 rounded-xl rotate-12 animate-float-slow" />
        <div className="absolute bottom-20 left-[10%] w-14 h-14 border border-accent/10 rounded-full animate-float-medium" style={{ animationDelay: "-5s" }} />
        <div className="absolute top-[45%] left-[6%] w-10 h-10 border border-primary/8 rounded-lg rotate-45 animate-float-slow" style={{ animationDelay: "-8s" }} />
        <div className="absolute bottom-[30%] right-[7%] w-8 h-8 rounded-full bg-primary/[0.04] animate-float-medium" style={{ animationDelay: "-2s" }} />
        <div className="absolute top-10 left-[30%] w-6 h-6 rounded-full bg-accent/[0.04] animate-float-slow" style={{ animationDelay: "-7s" }} />
      </div>

      <div className="mx-auto max-w-6xl relative z-10">
        <h2
          id="testimonials-heading"
          className="type-h2 text-center font-bold text-foreground"
        >
          {dict.socialProof.heading}
        </h2>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <blockquote
              key={i}
              className="glass-card p-6 transition-all duration-300 hover:scale-[1.02]"
            >
              <span className="text-3xl leading-none font-bold text-accent/70" aria-hidden="true">
                &ldquo;
              </span>
              <p className="type-body text-muted mt-2">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{t.author.charAt(0)}</span>
                </div>
                <cite className="not-italic">
                  <span className="block font-semibold text-foreground text-sm">{t.author}</span>
                  <span className="text-xs text-muted">{t.role}</span>
                </cite>
              </footer>
            </blockquote>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
          <span className="glass-card inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground/70" style={{ borderRadius: "9999px" }}>
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            {dict.socialProof.trustBadge}
          </span>
        </div>
      </div>
    </section>
  );
}
