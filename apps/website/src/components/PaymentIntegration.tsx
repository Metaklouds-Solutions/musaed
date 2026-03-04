"use client";

import { useInView } from "@/hooks/useInView";
import { ShieldCheck, CreditCard, Smartphone, Banknote, ArrowLeftRight, Receipt } from "lucide-react";

const PAYMENTS = [
  {
    name: "Mada",
    desc: "93% local card share · mandatory for all bank accounts",
    icon: CreditCard,
    accent: "#00843D",
    tag: "National Debit",
  },
  {
    name: "Apple Pay",
    desc: "36% user preference · integrated with Mada network",
    icon: Smartphone,
    accent: "#333333",
    tag: "Digital Wallet",
  },
  {
    name: "STC Pay",
    desc: "12M+ users · 18% wallet market share",
    icon: Smartphone,
    accent: "#6C3D94",
    tag: "Digital Wallet",
  },
  {
    name: "Visa & Mastercard",
    desc: "18% combined preference · Sharia-compliant options",
    icon: CreditCard,
    accent: "#1A1F71",
    tag: "Credit Cards",
  },
  {
    name: "Sarie",
    desc: "593M transactions in 2024 · instant bank transfers",
    icon: ArrowLeftRight,
    accent: "#00A884",
    tag: "Instant Payments",
  },
  {
    name: "Tamara",
    desc: "4M+ users · interest-free installments",
    icon: Receipt,
    accent: "#FF6B35",
    tag: "Buy Now Pay Later",
  },
  {
    name: "Tabby",
    desc: "Deferred payments · major retailers supported",
    icon: Receipt,
    accent: "#3CDFB4",
    tag: "Buy Now Pay Later",
  },
  {
    name: "SADAD",
    desc: "Gov fees & utility bills · critical infrastructure",
    icon: Banknote,
    accent: "#0072CE",
    tag: "Bill Payments",
  },
];

export default function PaymentIntegration() {
  const { ref, visible } = useInView(0.08);

  return (
    <section
      className="relative overflow-hidden bg-background px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36"
      aria-labelledby="payments-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(rgba(31,122,140,0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(31,122,140,0.3) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="floating-blob floating-blob-teal w-[400px] h-[400px] -top-20 right-[10%] animate-blob-drift opacity-25" style={{ animationDelay: "-2s" }} />
        <div className="floating-blob floating-blob-gold w-[300px] h-[300px] bottom-10 left-[5%] animate-blob-drift opacity-20" style={{ animationDelay: "-7s" }} />
        <div className="floating-blob floating-blob-mint w-[350px] h-[350px] top-1/2 left-1/2 -translate-x-1/2 animate-blob-drift opacity-20" style={{ animationDelay: "-4s" }} />
        <div className="absolute top-16 left-[8%] w-14 h-14 border border-primary/8 rounded-xl rotate-12 animate-float-slow" />
        <div className="absolute bottom-20 right-[12%] w-10 h-10 border border-accent/8 rounded-full animate-float-medium" style={{ animationDelay: "-5s" }} />
      </div>

      <div ref={ref} className="mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 lg:mb-18">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6 transition-all duration-700 ${visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}
          >
            <ShieldCheck size={16} className="text-primary" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">Local Payment Ready</span>
          </div>
          <h2
            id="payments-heading"
            className={`type-h2 font-bold tracking-tight text-foreground transition-all duration-700 ${visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}
            style={{ animationDelay: "100ms" }}
          >
            Every Payment Method Your Patients Use
          </h2>
          <p
            className={`type-body-lg text-muted mt-4 max-w-lg mx-auto transition-all duration-700 ${visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}
            style={{ animationDelay: "200ms" }}
          >
            Mosaed integrates with all major Saudi payment rails — so patients can pay during booking, and you never chase an invoice.
          </p>
        </div>

        {/* Payment grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {PAYMENTS.map((p, i) => (
            <div
              key={p.name}
              className={`glass-card group relative p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg ${visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}
              style={{ animationDelay: `${300 + i * 80}ms`, borderRadius: "18px" }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${p.accent}12` }}
              >
                <p.icon size={20} style={{ color: p.accent }} strokeWidth={1.8} />
              </div>

              {/* Tag */}
              <div className="mb-2">
                <span
                  className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: p.accent, background: `${p.accent}10` }}
                >
                  {p.tag}
                </span>
              </div>

              {/* Name & desc */}
              <h3 className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                {p.name}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Trust footer */}
        <div
          className={`mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 transition-all duration-700 ${visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"}`}
          style={{ animationDelay: "1000ms" }}
        >
          <div className="flex items-center gap-2 text-sm text-muted">
            <ShieldCheck size={16} className="text-green-500" />
            <span>PCI DSS Compliant</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-border/40" />
          <div className="flex items-center gap-2 text-sm text-muted">
            <ShieldCheck size={16} className="text-green-500" />
            <span>SAMA Regulated</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-border/40" />
          <div className="flex items-center gap-2 text-sm text-muted">
            <ShieldCheck size={16} className="text-green-500" />
            <span>Data Stays in the Kingdom</span>
          </div>
        </div>
      </div>
    </section>
  );
}
