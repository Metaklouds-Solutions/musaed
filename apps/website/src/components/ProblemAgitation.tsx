"use client";

import React from "react";
import type { Dictionary } from "@/lib/dictionaries";
import { CalendarX, PhoneOff, Users } from "lucide-react";
import { useInView } from "@/hooks/useInView";

export default function ProblemAgitation({ dict }: { dict: Dictionary }) {
  const { ref, visible } = useInView(0.08);

  const points = [
    { title: dict.problem.card1.title, body: dict.problem.card1.body, icon: PhoneOff },
    { title: dict.problem.card2.title, body: dict.problem.card2.body, icon: Users },
    { title: dict.problem.card3.title, body: dict.problem.card3.body, icon: CalendarX },
  ];

  return (
    <section
      className="relative overflow-hidden px-4 pt-24 pb-20 sm:px-6 sm:pt-32 sm:pb-28 lg:px-8 lg:pt-40 lg:pb-36"
      aria-labelledby="problem-heading"
      style={{ background: "#fdfdfd" }}
    >
      {/* Depth layers */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Grid — fades from top */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(220,38,38,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.05) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 55%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 55%)",
          }}
        />

        {/* Animated mesh wave — SVG with slow undulation */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="none" viewBox="0 0 1440 900">
          <path className="problem-wave-path" d="M0,450 C240,350 480,550 720,450 C960,350 1200,550 1440,450" fill="none" stroke="rgba(220,38,38,0.6)" strokeWidth="1.5" />
          <path className="problem-wave-path-2" d="M0,500 C240,400 480,600 720,500 C960,400 1200,600 1440,500" fill="none" stroke="rgba(220,38,38,0.4)" strokeWidth="1" />
          <path className="problem-wave-path-3" d="M0,400 C240,300 480,500 720,400 C960,300 1200,500 1440,400" fill="none" stroke="rgba(199,237,230,0.5)" strokeWidth="1" />
        </svg>

        {/* Fog orbs — soft diffused color washes */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] rounded-full animate-blob-drift"
          style={{ background: "radial-gradient(ellipse 70% 55%, rgba(220,38,38,0.04) 0%, transparent 65%)", filter: "blur(50px)" }}
        />
        <div
          className="absolute top-[25%] -left-[12%] w-[700px] h-[600px] rounded-full animate-blob-drift"
          style={{ background: "radial-gradient(ellipse, rgba(248,200,200,0.1) 0%, transparent 60%)", filter: "blur(70px)", animationDelay: "-4s" }}
        />
        <div
          className="absolute top-[45%] -right-[10%] w-[600px] h-[550px] rounded-full animate-blob-drift"
          style={{ background: "radial-gradient(ellipse, rgba(220,38,38,0.025) 0%, transparent 55%)", filter: "blur(60px)", animationDelay: "-8s" }}
        />
        <div
          className="absolute bottom-[5%] left-[20%] w-[800px] h-[400px] rounded-full animate-blob-drift"
          style={{ background: "radial-gradient(ellipse, rgba(199,237,230,0.06) 0%, transparent 60%)", filter: "blur(60px)", animationDelay: "-6s" }}
        />
        {/* Warm pink center fog */}
        <div
          className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse 60% 50%, rgba(255,220,220,0.07) 0%, transparent 70%)", filter: "blur(80px)" }}
        />

        {/* Top fog edge — blends from hero */}
        <div
          className="absolute top-0 left-0 right-0 h-40"
          style={{ background: "linear-gradient(to bottom, rgba(248,250,249,0.9), transparent)" }}
        />
        {/* Bottom fog edge — fades to white */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48"
          style={{ background: "linear-gradient(to top, #fdfdfd, transparent)" }}
        />

        {/* Scattered dot accents */}
        <div className="absolute top-[18%] right-[11%] w-2 h-2 rounded-full bg-red-400/25 animate-pulse" />
        <div className="absolute top-[45%] right-[22%] w-1.5 h-1.5 rounded-full bg-red-300/15 animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[65%] left-[7%] w-1.5 h-1.5 rounded-full bg-red-400/20 animate-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-[30%] left-[15%] w-1 h-1 rounded-full bg-red-300/20 animate-pulse" style={{ animationDelay: "0.8s" }} />
        <div className="absolute top-[80%] right-[15%] w-1 h-1 rounded-full bg-red-200/20 animate-pulse" style={{ animationDelay: "3s" }} />

        {/* Noise texture overlay for grain */}
        <div className="parallax-noise" />
      </div>

      <div ref={ref} className="mx-auto max-w-6xl relative z-10">
        {/* Heading */}
        <div
          className={`text-center mb-20 lg:mb-28 transition-all duration-700 ${
            visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"
          }`}
        >
          <h2
            id="problem-heading"
            className="type-h2 font-bold tracking-tight text-foreground max-w-3xl mx-auto"
          >
            {dict.problem.heading}
          </h2>
          <div className="mt-6 mx-auto w-10 h-[3px] rounded-full bg-red-400/60" />
        </div>

        {/* Pain points — visuals left | line | text right */}
        <div className="relative lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          {/* Continuous vertical line — spans all rows */}
          <div className="hidden lg:block lg:col-start-2 lg:row-start-1 lg:row-end-4 relative" aria-hidden="true">
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px border-l-2 border-dashed border-red-300/30" />
            {/* Dots aligned to each row */}
            {[0, 1, 2].map((i) => (
              <div key={i} className="absolute left-1/2 -translate-x-1/2" style={{ top: `calc(${i} * 33.33% + 16.66%)` }}>
                <div className="w-3.5 h-3.5 rounded-full bg-red-400/50 shadow-[0_0_10px_rgba(220,38,38,0.25)]" />
                <div className="absolute inset-0 rounded-full bg-red-400/25 animate-ping" />
              </div>
            ))}
          </div>

          {points.map((point, i) => (
            <React.Fragment key={i}>
              {/* Illustration — left column */}
              <div
                className={`flex justify-center lg:col-start-1 mb-6 lg:mb-0 transition-all duration-700 ${
                  visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"
                } ${i > 0 ? "mt-14 lg:mt-0" : ""}`}
                style={{ animationDelay: `${200 + i * 180}ms`, gridRow: i + 1 }}
                aria-hidden="true"
              >
                {i === 0 && <MissedCallIllustration />}
                {i === 1 && <OverwhelmedIllustration />}
                {i === 2 && <NoShowIllustration />}
              </div>

              {/* Text — right column */}
              <div
                className={`group lg:col-start-3 lg:flex lg:items-center transition-all duration-700 ${
                  visible ? "animate-fade-in-up" : "opacity-0 translate-y-8"
                } ${i > 0 ? "mt-14 lg:mt-0" : ""}`}
                style={{ animationDelay: `${300 + i * 180}ms`, gridRow: i + 1 }}
              >
                <div>
                  <h3 className="type-h4 font-semibold text-foreground mb-3 group-hover:text-red-500 transition-colors duration-300">
                    {point.title}
                  </h3>
                  <p className="type-body-lg text-muted max-w-lg leading-relaxed">
                    {point.body}
                  </p>
                  <div className="mt-5 w-16 h-px bg-gradient-to-r from-red-300/50 to-transparent" />
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Animated SVG Illustrations ── */

function MissedCallIllustration() {
  return (
    <div className="relative w-64 h-64 sm:w-72 sm:h-72">
      {/* Pulsing rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-56 h-56 rounded-full border border-red-200/40 problem-ring-pulse" />
        <div className="absolute w-44 h-44 rounded-full border border-red-200/30 problem-ring-pulse" style={{ animationDelay: "0.8s" }} />
        <div className="absolute w-32 h-32 rounded-full border border-red-300/20 problem-ring-pulse" style={{ animationDelay: "1.6s" }} />
      </div>
      {/* Phone */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-white border border-red-200/60 shadow-lg shadow-red-100/40 flex items-center justify-center problem-phone-shake">
            <PhoneOff size={32} className="text-red-400" strokeWidth={1.5} />
          </div>
          {/* "Missed" badge */}
          <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-semibold shadow-md animate-pulse">
            3
          </div>
        </div>
      </div>
      {/* Clock indicator */}
      <div className="absolute bottom-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-red-100 shadow-sm backdrop-blur-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="text-[11px] font-medium text-red-400">11:42 PM</span>
      </div>
    </div>
  );
}

function OverwhelmedIllustration() {
  return (
    <div className="relative w-64 h-64 sm:w-72 sm:h-72">
      {/* Desk scene */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Central person */}
        <div className="relative w-16 h-16 rounded-full bg-white border-2 border-red-200/50 shadow-lg flex items-center justify-center">
          <Users size={28} className="text-red-400" strokeWidth={1.5} />
        </div>

        {/* Orbiting task bubbles — positions pre-computed to avoid hydration mismatch */}
        {[
          { label: "Ringing...", x: 100, y: 0, delay: "0s" },
          { label: "Walk-in", x: 31, y: 95, delay: "0.3s" },
          { label: "Paperwork", x: -81, y: 59, delay: "0.6s" },
          { label: "Voicemail", x: -81, y: -59, delay: "0.9s" },
          { label: "Hold", x: 31, y: -95, delay: "1.2s" },
        ].map((task, idx) => (
          <div
            key={idx}
            className="absolute px-2.5 py-1 rounded-full bg-white border border-red-100/70 shadow-sm text-[10px] font-medium text-muted whitespace-nowrap problem-orbit-float"
            style={{
              left: `calc(50% + ${task.x}px - 28px)`,
              top: `calc(50% + ${task.y}px - 12px)`,
              animationDelay: task.delay,
            }}
          >
            {task.label}
          </div>
        ))}

        {/* Stress lines — pre-computed positions */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 288 288">
          <line x1="181" y1="107" x2="189" y2="99" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <line x1="107" y1="107" x2="99" y2="99" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <line x1="107" y1="181" x2="99" y2="189" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <line x1="181" y1="181" x2="189" y2="189" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function NoShowIllustration() {
  return (
    <div className="relative w-64 h-64 sm:w-72 sm:h-72">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Calendar card */}
        <div className="relative w-48 h-56 rounded-2xl bg-white border border-red-100/60 shadow-lg shadow-red-100/20 overflow-hidden">
          {/* Calendar header */}
          <div className="h-10 bg-gradient-to-r from-red-50 to-red-100/60 flex items-center px-3 border-b border-red-100/40">
            <CalendarX size={14} className="text-red-400" strokeWidth={2} />
            <span className="ml-2 text-[11px] font-semibold text-red-400">This Week</span>
          </div>
          {/* Time slots */}
          <div className="p-2.5 space-y-1.5">
            {[
              { time: "9:00", name: "Ahmed K.", status: "ok" },
              { time: "10:30", name: "Sara M.", status: "noshow" },
              { time: "11:00", name: "Fahad A.", status: "ok" },
              { time: "1:00", name: "Noura H.", status: "noshow" },
              { time: "2:30", name: "Khalid R.", status: "ok" },
              { time: "3:00", name: "Layla S.", status: "noshow" },
            ].map((slot, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] ${
                  slot.status === "noshow"
                    ? "bg-red-50/80 border border-red-200/50"
                    : "bg-gray-50/60"
                }`}
              >
                <span className="font-mono text-muted/60 w-8">{slot.time}</span>
                <span className={`flex-1 ${slot.status === "noshow" ? "text-red-400 line-through" : "text-foreground/70"}`}>
                  {slot.name}
                </span>
                {slot.status === "noshow" && (
                  <span className="text-[8px] font-bold text-red-400 uppercase tracking-wide">No-show</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Revenue loss badge */}
        <div className="absolute -bottom-1 -right-1 sm:bottom-2 sm:right-2 px-3 py-1.5 rounded-full bg-red-500/90 text-white text-[10px] font-semibold shadow-lg problem-badge-bounce">
          -2,000 SAR
        </div>
      </div>
    </div>
  );
}
