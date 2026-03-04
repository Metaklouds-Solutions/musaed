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
      className="relative overflow-hidden gradient-bg-dark px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
      aria-labelledby="testimonials-heading"
    >
      <div className="floating-blob floating-blob-teal w-[340px] h-[340px] -top-24 -left-20 animate-blob-drift" aria-hidden="true" />
      <div className="floating-blob floating-blob-gold w-[260px] h-[260px] bottom-10 right-0 animate-blob-drift" aria-hidden="true" style={{ animationDelay: "-6s" }} />

      <div className="mx-auto max-w-6xl relative z-10">
        <h2
          id="testimonials-heading"
          className="type-h2 text-center font-bold text-white"
        >
          {dict.socialProof.heading}
        </h2>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <blockquote
              key={i}
              className="glass-card p-6 transition-all duration-300 hover:scale-[1.02]"
            >
              <span className="text-3xl leading-none font-bold text-accent/80" aria-hidden="true">
                &ldquo;
              </span>
              <p className="type-body text-white/70 mt-2">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center">
                  <span className="text-sm font-bold text-accent">{t.author.charAt(0)}</span>
                </div>
                <cite className="not-italic">
                  <span className="block font-semibold text-white text-sm">{t.author}</span>
                  <span className="text-xs text-white/50">{t.role}</span>
                </cite>
              </footer>
            </blockquote>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
          <span className="glass-card inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white/80" style={{ borderRadius: "9999px" }}>
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            {dict.socialProof.trustBadge}
          </span>
        </div>
      </div>
    </section>
  );
}
