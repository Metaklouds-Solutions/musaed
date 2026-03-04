"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const HeroBackground3D = dynamic(() => import("./HeroBackground3D"), {
  ssr: false,
  loading: () => null,
});

export default function HeroBackgroundLayer() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setIsActive(entry.isIntersecting));
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="absolute inset-0 -z-10 overflow-hidden">
      {/* Vivid gradient blobs for glass refraction depth */}
      <div
        className="floating-blob floating-blob-mint w-[600px] h-[600px] -top-48 -right-24 animate-blob-drift"
        aria-hidden="true"
      />
      <div
        className="floating-blob floating-blob-teal w-[500px] h-[500px] top-1/4 -left-40 animate-blob-drift"
        aria-hidden="true"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="floating-blob floating-blob-gold w-[400px] h-[400px] bottom-10 right-1/4 animate-blob-drift"
        aria-hidden="true"
        style={{ animationDelay: "-8s" }}
      />
      <div
        className="floating-blob floating-blob-mint w-[350px] h-[350px] bottom-1/3 left-1/3 animate-blob-drift"
        aria-hidden="true"
        style={{ animationDelay: "-6s" }}
      />
      {/* Purple accent for modern depth */}
      <div
        className="floating-blob w-[450px] h-[450px] top-1/2 right-0 animate-blob-drift"
        aria-hidden="true"
        style={{
          animationDelay: "-3s",
          background: "radial-gradient(circle at 50% 45%, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0.06) 50%, transparent 75%)",
        }}
      />

      {/* Mobile pulse rings */}
      <div className="hero-mobile-pulse lg:hidden" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      {/* 3D background for desktop */}
      <div className="hidden h-full w-full lg:block" aria-hidden="true">
        <HeroBackground3D active={isActive} />
      </div>

      {/* Subtle gradient overlay for fade-to-section */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(248,250,249,0.5)]" />
    </div>
  );
}
