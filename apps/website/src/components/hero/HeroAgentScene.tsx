"use client";

import { useEffect, useState } from "react";

/*
 * Cycle duration: 14s. (1 step = 1s)
 * 0: Patient calling...
 * 1: Agent picked
 * 2: Agent taking info
 * 3: Sentiment analysis
 * 4: Finding doctors in system
 * 5: Doctor Found
 * 6: Appointment Booked
 * 7-9: Display appointment
 * 10-13: Idle
 */

type CallPhase = 
  | "idle" 
  | "calling" 
  | "picked" 
  | "info" 
  | "sentiment" 
  | "finding" 
  | "found" 
  | "booked";

interface CallState {
  phase: CallPhase;
  text: string;
  color: string;
}

function getCallState(t: number): CallState {
  if (t === 0) return { phase: "calling", text: "Patient calling...", color: "#1F7A8C" };
  if (t === 1) return { phase: "picked", text: "Agent picked", color: "#1F7A8C" };
  if (t === 2) return { phase: "info", text: "Agent taking info", color: "#1F7A8C" };
  if (t === 3) return { phase: "sentiment", text: "Sentiment analysis", color: "#6366f1" };
  if (t === 4) return { phase: "finding", text: "Finding doctors...", color: "#f59e0b" };
  if (t === 5) return { phase: "found", text: "Doctor Found", color: "#10b981" };
  if (t >= 6 && t <= 9) return { phase: "booked", text: "Appointment Booked", color: "#1F7A8C" };
  return { phase: "idle", text: "", color: "" };
}

const ALL_TASKS = [
  { text: "Call 1: Patient calling...", color: "#1F7A8C" },
  { text: "Call 1: Agent picked", color: "#1F7A8C" },
  { text: "Call 1: Taking info", color: "#1F7A8C" },
  { text: "Call 1: Sentiment analysis", color: "#6366f1" },
  { text: "Call 1: Finding doctors", color: "#f59e0b" },
  { text: "Call 1: Doctor Found", color: "#10b981" },
  { text: "Call 1: Booking Appt...", color: "#1F7A8C" },
  
  { text: "Call 2: Patient calling...", color: "#1F7A8C" },
  { text: "Call 2: Agent picked", color: "#1F7A8C" },
  { text: "Call 2: Taking info", color: "#1F7A8C" },
  { text: "Call 2: Sentiment analysis", color: "#6366f1" },
  { text: "Call 2: Finding doctors", color: "#f59e0b" },
  { text: "Call 2: Doctor Found", color: "#10b981" },
  { text: "Call 2: Booking Appt...", color: "#1F7A8C" },
];

/* ── SVG sub-components ── */

function GlobalQueue({ totalTime }: { totalTime: number }) {
  const recent = [];
  // show tasks from totalTime - 4 up to totalTime to have a smooth scrolling log (5 items total)
  for(let i = totalTime - 4; i <= totalTime; i++) {
    if (i < 0) continue;
    recent.push({ ...ALL_TASKS[i % 14], id: i });
  }

  return (
    <g transform="translate(270, 310)">
       <text x="0" y="-18" textAnchor="middle" fontSize="11" fill="#1F7A8C" fontWeight="600" opacity="0.8">Live Agent Task Queue</text>
       
       <rect x="-85" y="-5" width="170" height="85" fill="rgba(255,255,255,0.4)" rx="8" stroke="rgba(255,255,255,0.6)" strokeWidth="1" style={{ filter: "drop-shadow(0px 2px 8px rgba(31, 122, 140, 0.05))" }} />
       
       <g clipPath="url(#queueClip)">
         {recent.map((task, idx) => {
            const offset = 5 - recent.length;
            const yPos = (idx + offset - 1) * 20 + 5;
            const opacity = (idx === 0 && recent.length === 5) ? 0 : 1;
            
            return (
               <g key={task.id} transform={`translate(0, ${yPos})`} style={{ transition: "all 0.5s ease", opacity }}>
                  <rect x="-75" y="0" width="150" height="15" rx="4" fill="rgba(255,255,255,0.6)" stroke={task.color} strokeWidth="0.5" strokeOpacity="0.4" />
                  <circle cx="-65" cy="7.5" r="3" fill={task.color} opacity="0.8" />
                  <text x="-55" y="10.5" textAnchor="start" fontSize="8" fill="#1a1a1a" fontWeight="500" opacity="0.8">{task.text}</text>
               </g>
            )
         })}
       </g>
       <defs>
         <clipPath id="queueClip">
           <rect x="-85" y="-5" width="170" height="85" rx="8" />
         </clipPath>
       </defs>
    </g>
  )
}

function CallerIcon({ x, y, state }: { x: number; y: number; state: CallState }) {
  const visible = state.phase !== "idle" && state.phase !== "booked";
  const isCalling = state.phase === "calling";
  
  return (
    <g
      transform={`translate(${x}, ${y})`}
      opacity={visible ? 1 : 0.2}
      style={{ transition: "opacity 0.5s ease" }}
    >
      <circle
        cx="0" cy="0" r="28"
        fill="none" stroke="rgba(31,122,140,0.35)" strokeWidth="1.8"
        className={isCalling ? "agent-caller-ring" : ""}
        style={{ transformOrigin: "0px 0px" }}
      />
      <circle cx="0" cy="0" r="24" fill="url(#glossyNodeFill)" stroke="rgba(31,122,140,0.28)" strokeWidth="1.2" filter="url(#nodeGlow)" />
      <ellipse cx="0" cy="-8" rx="16" ry="10" fill="rgba(255,255,255,0.25)" style={{ pointerEvents: "none" }} />
      <g transform="translate(-10, -10) scale(0.85)">
        <path
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
          fill="none" stroke="#1F7A8C" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"
        />
      </g>
      <text x="0" y="42" textAnchor="middle" fontSize="10" fill="#1F7A8C" fontWeight="600" opacity={visible ? 0.9 : 0}>
        Patient
      </text>
    </g>
  );
}

function SoundWaves({ x, y, rotation, state }: { x: number; y: number; rotation: number; state: CallState }) {
  const isActive = state.phase !== "idle" && state.phase !== "calling" && state.phase !== "booked";
  const isSpeaking = state.phase === "info" || state.phase === "sentiment";

  const heights = isSpeaking
    ? [10, 18, 26, 14, 30, 24, 16, 10, 14]
    : [6, 10, 14, 8, 16, 12, 10, 6, 8];

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      {isActive && (
        <g>
          {heights.map((h, i) => (
            <rect
              key={`wave-${i}`}
              x={i * 8 - 32}
              y={-h / 2}
              width={4}
              height={h}
              fill={isSpeaking ? "rgba(199,237,230,0.95)" : "rgba(31,122,140,0.85)"}
              rx={2}
              style={{
                transformOrigin: "center",
                transformBox: "fill-box",
                animation: `agent-audio-bar-pulse ${0.8 + (i % 3) * 0.2}s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
                transition: "height 0.4s ease, y 0.4s ease, fill 0.4s ease"
              }}
            />
          ))}
        </g>
      )}
    </g>
  );
}

function ConnectionParticlesCurved({ start, end, isActive, delayOffset = 0 }: { start: [number, number]; end: [number, number]; isActive: boolean; delayOffset?: number }) {
  if (!isActive) return null;
  const pathData = `M ${start[0]},${start[1]} C ${start[0] + 50},${start[1]} ${end[0] - 50},${end[1]} ${end[0]},${end[1]}`;
  
  return (
    <g>
      <path d={pathData} fill="none" stroke="rgba(31,122,140,0.25)" strokeWidth="2" strokeDasharray="4 4" />
      {[0, 1, 2].map((i) => (
        <circle key={i} r="3.5" fill="rgba(31,122,140,0.8)">
          <animateMotion
            dur="1.5s"
            repeatCount="indefinite"
            begin={`${i * 0.5 + delayOffset}s`}
            path={pathData}
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.1;0.9;1"
            dur="1.5s"
            repeatCount="indefinite"
            begin={`${i * 0.5 + delayOffset}s`}
          />
        </circle>
      ))}
    </g>
  );
}

function ConnectionParticlesStraight({ start, end, isActive }: { start: [number, number]; end: [number, number]; isActive: boolean }) {
  if (!isActive) return null;
  const pathData = `M ${start[0]},${start[1]} L ${end[0]},${end[1]}`;
  
  return (
    <g>
      <path d={pathData} fill="none" stroke="rgba(31,122,140,0.25)" strokeWidth="2" strokeDasharray="4 4" />
      {[0, 1, 2].map((i) => (
        <circle key={i} r="3" fill="rgba(31,122,140,0.8)">
          <animateMotion
            dur="1s"
            repeatCount="indefinite"
            begin={`${i * 0.33}s`}
            path={pathData}
          />
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.1;0.9;1"
            dur="1s"
            repeatCount="indefinite"
            begin={`${i * 0.33}s`}
          />
        </circle>
      ))}
    </g>
  );
}

function CalendarCard({ x, y, state, doctor }: { x: number; y: number; state: CallState; doctor: string }) {
  const isBooked = state.phase === "booked";
  return (
    <g
      transform={`translate(${x}, ${y})`}
      opacity={isBooked ? 1 : 0.45}
      style={{ transition: "opacity 0.6s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}
    >
      <g style={isBooked ? { animation: "calendar-slide-in 0.5s ease-out both" } : undefined}>
        <rect
          x="0" y="0"
          width="135" height="92"
          rx="14"
          fill={isBooked ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)"}
          stroke={isBooked ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.6)"}
          strokeWidth="1.5"
          style={{ filter: `drop-shadow(0px 8px 24px rgba(31, 122, 140, ${isBooked ? 0.12 : 0.04}))`, transition: "fill 0.5s ease, stroke 0.5s ease" }}
        />

        <g transform="translate(12, 12)">
          <rect x="0" y="0" width="18" height="18" rx="6" fill="rgba(31,122,140,0.08)" />
          <rect x="4" y="4" width="10" height="10" rx="2.5" fill="none" stroke="#1F7A8C" strokeWidth="1.2" />
          <line x1="4" y1="8" x2="14" y2="8" stroke="#1F7A8C" strokeWidth="1.2" />
          <line x1="7" y1="3" x2="7" y2="5" stroke="#1F7A8C" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="11" y1="3" x2="11" y2="5" stroke="#1F7A8C" strokeWidth="1.2" strokeLinecap="round" />
          <text x="26" y="12" fontSize="9" fill="#1F7A8C" fontWeight="700">Appointment</text>
        </g>

        <line x1="12" y1="40" x2="123" y2="40" stroke="rgba(31,122,140,0.08)" strokeWidth="1" />

        <text x="12" y="56" fontSize="8" fill="#1a1a1a" fontWeight="600">{doctor}</text>
        <text x="12" y="68" fontSize="7" fill="#475569" opacity="0.8">Next Available</text>

        {isBooked ? (
          <>
            <rect x="12" y="74" width="48" height="12" rx="4" fill="rgba(16, 185, 129, 0.12)" />
            <text x="36" y="82.5" textAnchor="middle" fontSize="6.5" fill="#10b981" fontWeight="700">Confirmed</text>
            <g transform="translate(100, 52)">
              <circle cx="12" cy="12" r="10" fill="rgba(16, 185, 129, 0.12)" />
              <polyline points="8,12 11,15 16,9" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="agent-check-draw" />
            </g>
          </>
        ) : (
          <>
            <rect x="12" y="74" width="48" height="12" rx="4" fill="rgba(31, 122, 140, 0.06)" />
            <text x="36" y="82.5" textAnchor="middle" fontSize="6.5" fill="#94a3b8" fontWeight="600">Pending</text>
            <g transform="translate(100, 52)">
              <circle cx="12" cy="12" r="10" fill="rgba(31,122,140,0.06)" />
              <circle cx="12" cy="12" r="1.5" fill="#94a3b8" />
            </g>
          </>
        )}
      </g>
    </g>
  );
}

function DynamicAgentIcon({ phase }: { phase: CallPhase }) {
  let content = null;
  switch (phase) {
    case "calling":
      content = (
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      );
      break;
    case "picked":
    case "info":
      content = (
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      );
      break;
    case "sentiment":
      content = (
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      );
      break;
    case "finding":
      content = (
        <>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </>
      );
      break;
    case "found":
    case "booked":
      content = (
        <polyline points="20 6 9 17 4 12" />
      );
      break;
    case "idle":
    default:
      content = (
         <path d="M2 12h4l3-9 5 18 3-9h5" />
      );
      break;
  }

  return (
    <svg x="-12" y="-12" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "all 0.3s ease" }}>
      {content}
    </svg>
  );
}

function AgenticCore({ isActive, activePhase }: { isActive: boolean; activePhase: CallPhase }) {
  const nodes = [
    { x: 0, y: -55, delay: "0s" },
    { x: 48, y: -28, delay: "0.25s" },
    { x: 48, y: 28, delay: "0.5s" },
    { x: 0, y: 55, delay: "0.75s" },
    { x: -48, y: 28, delay: "1s" },
    { x: -48, y: -28, delay: "1.25s" },
  ];

  return (
    <g transform="translate(270, 120)">
      <circle
        cx="0" cy="0" r="65"
        fill="none" stroke="rgba(31,122,140,0.15)" strokeWidth="1"
      />
      <circle
        cx="0" cy="0" r="50"
        fill="none" stroke="rgba(31,122,140,0.45)" strokeWidth="2"
        strokeLinecap="round" strokeDasharray="70 250"
        className={isActive ? "hero-agent-ring-spin" : ""}
      />
      <circle
        cx="0" cy="0" r="40"
        fill="none" stroke="rgba(199,237,230,0.9)" strokeWidth="1.5"
        strokeLinecap="round" strokeDasharray="50 200"
        className={isActive ? "hero-agent-ring-spin-reverse" : ""}
      />

      {isActive && (
        <>
          <circle cx="0" cy="0" r="22" fill="none" stroke="rgba(31,122,140,0.25)" strokeWidth="1.5" className="hero-agent-wave" />
          <circle
            cx="0" cy="0" r="22" fill="none" stroke="rgba(31,122,140,0.2)" strokeWidth="1.5"
            className="hero-agent-wave" style={{ animationDelay: "0.9s" }}
          />
        </>
      )}

      <g className={isActive ? "hero-agent-core-breathe" : ""} filter="url(#iconGlow)">
        <rect
          x="-18" y="-18" width="36" height="36" rx="10"
          fill="url(#glossyIconFill)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"
        />
        <rect
          x="-18" y="-18" width="36" height="18" rx="10"
          fill="url(#glossyHighlight)"
          style={{ pointerEvents: "none" }}
        />
        <DynamicAgentIcon phase={activePhase} />
      </g>

      {nodes.map((node, i) => (
        <g key={`node-${i}`} transform={`translate(${node.x}, ${node.y})`}>
          <line
            x1="0" y1="0" x2={-node.x * 0.45} y2={-node.y * 0.45}
            stroke="rgba(31,122,140,0.3)" strokeWidth="1.5"
            className={isActive ? "hero-agent-link-flicker" : ""}
            style={{ animationDelay: node.delay }}
          />
          <circle
            cx="0" cy="0" r="6"
            fill="url(#glossyNodeFill)" stroke="rgba(31,122,140,0.5)" strokeWidth="1.2"
            className={isActive ? "hero-agent-node-pulse" : ""}
            style={{ animationDelay: node.delay }}
            filter="url(#nodeGlow)"
          />
          <circle
            cx="0" cy="-1.5" r="3"
            fill="rgba(255,255,255,0.4)"
            style={{ pointerEvents: "none" }}
          />
        </g>
      ))}
    </g>
  );
}

/* ── Main Scene ── */

export default function HeroAgentScene() {
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTotalTime(t => t + 1);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const state1 = getCallState(totalTime % 14);
  const state2 = getCallState((totalTime + 7) % 14); // offset by half cycle

  const isAgentActive = state1.phase !== "idle" || state2.phase !== "idle";
  
  let activePhase = state1.phase;
  if (state1.phase === "idle" || state1.phase === "booked") {
    if (state2.phase !== "idle") {
      activePhase = state2.phase;
    }
  }

  return (
    <div className="relative w-full h-full select-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 600 400"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        style={{ zIndex: 2 }}
      >
        <defs>
          <radialGradient id="heroCoreGradient" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#d8f2ec" />
            <stop offset="55%" stopColor="#4ea8b8" />
            <stop offset="100%" stopColor="#1F7A8C" />
          </radialGradient>
          <linearGradient id="glossyIconFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0c878" />
            <stop offset="40%" stopColor="#e4b980" />
            <stop offset="100%" stopColor="#c99a56" />
          </linearGradient>
          <linearGradient id="glossyHighlight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="glossyNodeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,1)" />
            <stop offset="100%" stopColor="rgba(230,245,242,1)" />
          </linearGradient>
          <filter id="iconGlow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(31,122,140,0.35)" />
          </filter>
          <filter id="nodeGlow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(31,122,140,0.25)" />
          </filter>
        </defs>

        {/* Top-Center Agent */}
        <AgenticCore isActive={isAgentActive} activePhase={activePhase} />

        {/* Bottom-Center Queue */}
        <GlobalQueue totalTime={totalTime} />
        
        {/* Agent to Queue Link */}
        <ConnectionParticlesStraight start={[270, 185]} end={[270, 290]} isActive={isAgentActive} />

        {/* --- Call 1 (Top Left) --- */}
        <CallerIcon x={70} y={100} state={state1} />
        {state1.phase !== "booked" && state1.phase !== "idle" && (
          <path d="M105,100 L 210,114" fill="none" stroke="rgba(31,122,140,0.25)" strokeWidth="2" strokeDasharray="4 4" />
        )}
        <SoundWaves x={157.5} y={107} rotation={7.6} state={state1} />
        
        {/* Connection Queue -> Appointment 1 */}
        <ConnectionParticlesCurved start={[355, 347]} end={[450, 96]} isActive={state1.phase === "booked"} />
        <CalendarCard x={450} y={50} state={state1} doctor="Dr. Sarah (Cardiology)" />

        {/* --- Call 2 (Bottom Left) --- */}
        <CallerIcon x={70} y={280} state={state2} />
        {state2.phase !== "booked" && state2.phase !== "idle" && (
          <path d="M105,280 L 220,160" fill="none" stroke="rgba(31,122,140,0.25)" strokeWidth="2" strokeDasharray="4 4" />
        )}
        <SoundWaves x={162.5} y={220} rotation={-46.2} state={state2} />
        
        {/* Connection Queue -> Appointment 2 */}
        <ConnectionParticlesCurved start={[355, 347]} end={[450, 256]} isActive={state2.phase === "booked"} delayOffset={0.2} />
        <CalendarCard x={450} y={210} state={state2} doctor="Dr. Ahmed (General)" />

      </svg>
    </div>
  );
}
