"use client";

import { useEffect, useRef } from "react";

export default function ParallaxBackground() {
  const deepLayerRef = useRef<HTMLDivElement>(null);
  const midLayerRef = useRef<HTMLDivElement>(null);
  const frontLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;

    const update = () => {
      rafId = 0;
      const y = window.scrollY;
      const wrap = (value: number, span: number) =>
        ((value % span) + span) % span - span / 2;

      if (deepLayerRef.current) {
        deepLayerRef.current.style.transform = `translate3d(${wrap(y * 0.03, 100)}px, ${wrap(y * -0.10, 200)}px, 0)`;
      }

      if (midLayerRef.current) {
        midLayerRef.current.style.transform = `translate3d(${wrap(y * 0.06, 140)}px, ${wrap(y * -0.22, 280)}px, 0)`;
      }

      if (frontLayerRef.current) {
        frontLayerRef.current.style.transform = `translate3d(${wrap(y * 0.10, 200)}px, ${wrap(y * -0.36, 360)}px, 0)`;
      }
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div className="parallax-root" aria-hidden="true">
      {/* Noise texture overlay for depth */}
      <div className="parallax-noise" />

      {/* Deep layer — large vivid gradient mesh orbs */}
      <div ref={deepLayerRef} className="parallax-layer parallax-layer-deep">
        <span className="parallax-orb parallax-orb-teal top-[3%] left-[-8%] h-[44rem] w-[44rem]" />
        <span className="parallax-orb parallax-orb-mint top-[28%] right-[-12%] h-[50rem] w-[50rem]" />
        <span className="parallax-orb parallax-orb-gold top-[55%] left-[5%] h-[38rem] w-[38rem]" />
        <span className="parallax-orb parallax-orb-purple top-[78%] right-[8%] h-[36rem] w-[36rem]" />
        <span className="parallax-orb parallax-orb-teal top-[92%] left-[30%] h-[42rem] w-[42rem]" />
      </div>

      {/* Mid layer — medical icon silhouettes + glass chips */}
      <div ref={midLayerRef} className="parallax-layer parallax-layer-mid">
        {/* Floating healthcare symbols — subtle outlines */}
        <svg className="parallax-icon top-[8%] right-[15%]" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(31,122,140,0.12)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        <svg className="parallax-icon top-[22%] left-[12%]" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(199,237,230,0.18)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <svg className="parallax-icon top-[38%] right-[28%]" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(31,122,140,0.10)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
        </svg>
        <svg className="parallax-icon top-[52%] left-[65%]" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(228,185,128,0.12)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
        <svg className="parallax-icon top-[68%] left-[8%]" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="rgba(31,122,140,0.10)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
        </svg>
        <svg className="parallax-icon top-[82%] right-[20%]" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="rgba(199,237,230,0.14)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>

        {/* Glass chips — frosted mini squares */}
        <span className="parallax-glass-chip top-[16%] left-[42%]" />
        <span className="parallax-glass-chip top-[44%] right-[38%]" />
        <span className="parallax-glass-chip top-[72%] left-[55%]" />
        <span className="parallax-glass-chip top-[90%] left-[25%]" />
      </div>

      {/* Front layer — tiny sparkle dots */}
      <div ref={frontLayerRef} className="parallax-layer parallax-layer-front">
        <span className="parallax-sparkle top-[10%] left-[25%]" />
        <span className="parallax-sparkle top-[20%] right-[18%]" />
        <span className="parallax-sparkle top-[35%] left-[70%]" />
        <span className="parallax-sparkle top-[48%] left-[15%]" />
        <span className="parallax-sparkle top-[60%] right-[25%]" />
        <span className="parallax-sparkle top-[75%] left-[45%]" />
        <span className="parallax-sparkle top-[88%] right-[35%]" />
      </div>
    </div>
  );
}
