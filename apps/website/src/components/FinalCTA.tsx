"use client";

import { useState } from "react";
import { MessageCircle, SendHorizonal } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";

const WHATSAPP_NUMBER = "966500000000";
const WHATSAPP_MESSAGE_EN =
  "Hello, I would like to book a free demo of Mosaed for my clinic.";
const WHATSAPP_MESSAGE_AR = "مرحباً، أود حجز عرض مجاني من مساعد لعيادتي.";

export default function FinalCTA({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale?: "ar" | "en";
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const lang = locale ?? "en";
  const whatsappMessage = encodeURIComponent(
    lang === "ar" ? WHATSAPP_MESSAGE_AR : WHATSAPP_MESSAGE_EN
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = e.currentTarget;
    await new Promise((r) => setTimeout(r, 800));
    form.reset();
    setStatus("success");
  }

  return (
    <section
      id="final-cta"
      className="relative overflow-hidden gradient-bg-cta px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
      aria-labelledby="final-cta-heading"
    >
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5" style={{ filter: "blur(80px)" }} aria-hidden="true" />
      <div className="absolute bottom-10 -left-20 w-56 h-56 rounded-full bg-white/5" style={{ filter: "blur(80px)" }} aria-hidden="true" />

      <div className="mx-auto max-w-2xl text-center relative z-10">
        <h2
          id="final-cta-heading"
          className="type-h3 font-bold text-primary-foreground"
        >
          {dict.finalCta.headline}
        </h2>
        <p className="type-body-lg mt-4 text-primary-foreground/85">
          {dict.finalCta.subheadline}
        </p>

        <form
          onSubmit={handleSubmit}
          className="glass-card-strong mt-10 flex flex-col gap-4 p-6 sm:p-8"
          style={{
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(40px) saturate(1.8)",
            WebkitBackdropFilter: "blur(40px) saturate(1.8)",
            borderRadius: "var(--lg-radius-lg)",
          }}
        >
          <input
            type="text"
            name="name"
            placeholder={dict.finalCta.form.name}
            required
            className="w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-3.5 text-foreground placeholder:text-muted/60 shadow-sm transition-all focus:border-primary/40 focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="text"
            name="clinic"
            placeholder={dict.finalCta.form.clinic}
            required
            className="w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-3.5 text-foreground placeholder:text-muted/60 shadow-sm transition-all focus:border-primary/40 focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="tel"
            name="phone"
            placeholder={dict.finalCta.form.phone}
            required
            className="w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-3.5 text-foreground placeholder:text-muted/60 shadow-sm transition-all focus:border-primary/40 focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="text"
            name="city"
            placeholder={dict.finalCta.form.city}
            required
            className="w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-3.5 text-foreground placeholder:text-muted/60 shadow-sm transition-all focus:border-primary/40 focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="btn-liquid inline-flex min-h-[48px] items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-primary-foreground transition-all disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
            style={{ borderRadius: "9999px" }}
          >
            <SendHorizonal size={16} />
            {status === "submitting"
              ? "..."
              : status === "success"
                ? "Thank you!"
                : dict.finalCta.form.submit}
          </button>
        </form>

        <p className="mt-6 text-sm text-primary-foreground/75">
          {dict.finalCta.whatsapp}{" "}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-white underline underline-offset-2 hover:no-underline transition-colors"
          >
            <MessageCircle size={14} />
            →
          </a>
        </p>
      </div>
    </section>
  );
}
