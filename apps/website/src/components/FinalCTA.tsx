"use client";

import { useState, useEffect, useRef } from "react";
import { SendHorizonal, X, ArrowRight, CalendarCheck } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";

export default function FinalCTA({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale?: "ar" | "en";
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = e.currentTarget;
    await new Promise((r) => setTimeout(r, 800));
    form.reset();
    setStatus("success");
    setTimeout(() => {
      setModalOpen(false);
      setStatus("idle");
    }, 2000);
  }

  return (
    <>
      <section
        id="final-cta"
        className="relative overflow-hidden gradient-bg-cta px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36"
        aria-labelledby="final-cta-heading"
      >
        {/* Background depth */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          />

          {/* Floating orbs */}
          <div className="floating-blob w-[450px] h-[450px] -top-24 -right-24 animate-blob-drift opacity-30" style={{ background: "radial-gradient(circle, rgba(228,185,128,0.5) 0%, transparent 70%)", animationDelay: "0s" }} />
          <div className="floating-blob w-[400px] h-[400px] bottom-0 -left-20 animate-blob-drift opacity-25" style={{ background: "radial-gradient(circle, rgba(167,232,220,0.4) 0%, transparent 70%)", animationDelay: "-5s" }} />
          <div className="floating-blob w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-blob-drift opacity-20" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)", animationDelay: "-8s" }} />
          <div className="floating-blob w-[350px] h-[350px] top-[20%] left-[15%] animate-blob-drift opacity-20" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)", animationDelay: "-3s" }} />

          {/* Geometric shapes */}
          <div className="absolute top-[12%] left-[10%] w-16 h-16 border border-white/10 rounded-xl rotate-12 animate-float-slow" />
          <div className="absolute top-[20%] right-[8%] w-12 h-12 border border-white/8 rounded-full animate-float-medium" style={{ animationDelay: "-4s" }} />
          <div className="absolute bottom-[18%] left-[6%] w-10 h-10 border border-white/6 rounded-lg rotate-45 animate-float-slow" style={{ animationDelay: "-7s" }} />
          <div className="absolute bottom-[12%] right-[14%] w-14 h-14 border border-white/8 rounded-xl -rotate-12 animate-float-medium" style={{ animationDelay: "-2s" }} />
          <div className="absolute top-[55%] left-[35%] w-6 h-6 rounded-full bg-white/[0.04] animate-float-slow" style={{ animationDelay: "-9s" }} />
          <div className="absolute top-[8%] right-[28%] w-8 h-8 rounded-full bg-accent/[0.08] animate-float-medium" style={{ animationDelay: "-6s" }} />
          <div className="absolute bottom-[25%] left-[45%] w-5 h-5 rounded-full bg-white/[0.03] animate-float-slow" style={{ animationDelay: "-1s" }} />
        </div>

        <div className="mx-auto max-w-2xl text-center relative z-10">
          <h2
            id="final-cta-heading"
            className="type-h2 font-bold text-primary-foreground"
          >
            {dict.finalCta.headline}
          </h2>
          <p className="type-body-lg mt-5 text-primary-foreground/85 max-w-lg mx-auto">
            {dict.finalCta.subheadline}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setModalOpen(true)}
              className="btn-liquid inline-flex items-center gap-2.5 px-10 py-4 text-white font-semibold text-base"
              style={{ borderRadius: "9999px" }}
            >
              <CalendarCheck size={20} strokeWidth={2} />
              {dict.finalCta.cta}
              <ArrowRight size={18} strokeWidth={2} />
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-chat"))}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white/90 border border-white/30 rounded-full hover:bg-white/10 transition-all duration-200"
            >
              {(locale ?? "en") === "ar" ? "أو تحدث معنا" : "Or chat with us"}
            </button>
          </div>
        </div>
      </section>

      {/* Modal overlay */}
      {modalOpen && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === backdropRef.current) setModalOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-md overflow-hidden">
            {/* Grid */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                backgroundSize: "50px 50px",
              }}
            />
            {/* Orbs */}
            <div className="floating-blob w-[400px] h-[400px] -top-20 -left-20 animate-blob-drift opacity-30" style={{ background: "radial-gradient(circle, rgba(31,122,140,0.5) 0%, transparent 70%)", animationDelay: "0s" }} />
            <div className="floating-blob w-[350px] h-[350px] top-1/3 -right-16 animate-blob-drift opacity-25" style={{ background: "radial-gradient(circle, rgba(228,185,128,0.45) 0%, transparent 70%)", animationDelay: "-4s" }} />
            <div className="floating-blob w-[300px] h-[300px] bottom-10 left-1/4 animate-blob-drift opacity-25" style={{ background: "radial-gradient(circle, rgba(167,232,220,0.4) 0%, transparent 70%)", animationDelay: "-8s" }} />
            <div className="floating-blob w-[250px] h-[250px] bottom-1/3 right-1/3 animate-blob-drift opacity-20" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)", animationDelay: "-3s" }} />
            {/* Shapes */}
            <div className="absolute top-[15%] left-[12%] w-16 h-16 border border-white/10 rounded-xl rotate-12 animate-float-slow" />
            <div className="absolute top-[25%] right-[10%] w-12 h-12 border border-white/8 rounded-full animate-float-medium" style={{ animationDelay: "-5s" }} />
            <div className="absolute bottom-[20%] left-[8%] w-10 h-10 border border-white/8 rounded-lg rotate-45 animate-float-slow" style={{ animationDelay: "-7s" }} />
            <div className="absolute bottom-[15%] right-[15%] w-14 h-14 border border-white/6 rounded-xl -rotate-12 animate-float-medium" style={{ animationDelay: "-2s" }} />
            <div className="absolute top-[60%] left-[40%] w-5 h-5 rounded-full bg-white/[0.04] animate-float-slow" style={{ animationDelay: "-9s" }} />
            <div className="absolute top-[10%] right-[30%] w-7 h-7 rounded-full bg-white/[0.03] animate-float-medium" style={{ animationDelay: "-6s" }} />
          </div>

          <div
            className="relative w-full max-w-md animate-fade-in-up"
            role="dialog"
            aria-modal="true"
            aria-label="Book a Free Demo"
          >
            <div className="glass-card-strong overflow-hidden" style={{ borderRadius: "24px" }}>
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <div>
                  <h3 className="type-h5 font-bold text-foreground">{dict.finalCta.cta}</h3>
                  <p className="text-xs text-muted mt-1">
                    {(locale ?? "en") === "ar"
                      ? "املأ البيانات وسنتواصل معك خلال ساعات"
                      : "Fill in your details and we'll reach out within hours"}
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-border/20 flex items-center justify-center transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X size={16} className="text-muted" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 flex flex-col gap-3.5">
                <input
                  type="text"
                  name="name"
                  placeholder={dict.finalCta.form.name}
                  required
                  className="w-full rounded-xl border border-border/40 bg-white/60 px-4 py-3 text-sm text-foreground placeholder:text-muted/50 shadow-sm transition-all focus:border-primary/40 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  name="clinic"
                  placeholder={dict.finalCta.form.clinic}
                  required
                  className="w-full rounded-xl border border-border/40 bg-white/60 px-4 py-3 text-sm text-foreground placeholder:text-muted/50 shadow-sm transition-all focus:border-primary/40 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder={dict.finalCta.form.phone}
                  required
                  className="w-full rounded-xl border border-border/40 bg-white/60 px-4 py-3 text-sm text-foreground placeholder:text-muted/50 shadow-sm transition-all focus:border-primary/40 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  name="city"
                  placeholder={dict.finalCta.form.city}
                  required
                  className="w-full rounded-xl border border-border/40 bg-white/60 px-4 py-3 text-sm text-foreground placeholder:text-muted/50 shadow-sm transition-all focus:border-primary/40 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  disabled={status === "submitting" || status === "success"}
                  className="btn-liquid mt-2 inline-flex min-h-[48px] w-full items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-white transition-all disabled:opacity-70"
                  style={{ borderRadius: "14px" }}
                >
                  {status === "submitting" ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  ) : status === "success" ? (
                    <>✓ {(locale ?? "en") === "ar" ? "تم بنجاح! سنتواصل معك قريباً" : "Submitted! We'll be in touch soon"}</>
                  ) : (
                    <>
                      <SendHorizonal size={16} />
                      {dict.finalCta.form.submit}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
