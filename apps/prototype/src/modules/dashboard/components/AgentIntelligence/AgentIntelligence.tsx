/**
 * AI performance: circular gauge for confidence, escalation with tooltip.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { Card } from '../../../../shared/ui';
import type { DashboardMetrics } from '../../../../shared/types';

const EMPTY_AI_METRICS: Pick<DashboardMetrics, 'aiConfidenceScore' | 'escalationRate'> = {
  aiConfidenceScore: 0,
  escalationRate: 0,
};

interface AgentIntelligenceProps {
  metrics: DashboardMetrics | null | undefined;
}

function ConfidenceGauge({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-14 h-14">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="var(--bg-subtle)"
          strokeWidth="4"
        />
        <motion.circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="url(#confidenceGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
        <defs>
          <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--ds-accent-start)" />
            <stop offset="100%" stopColor="var(--ds-accent-end)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--text-primary)] tabular-nums">
        {value}%
      </span>
    </div>
  );
}

export function AgentIntelligence({ metrics }: AgentIntelligenceProps) {
  const m = metrics ?? EMPTY_AI_METRICS;
  const [escalationHovered, setEscalationHovered] = useState(false);
  const tooltipId = 'agent-intelligence-escalation-tooltip';

  return (
    <Card className="p-5 min-h-[140px]">
      <h3 className="text-[var(--typography-subheading)] font-semibold text-[var(--text-primary)] mb-4">
        AI performance
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ConfidenceGauge value={m.aiConfidenceScore} />
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">AI confidence score</p>
            <p className="text-[length:var(--typography-heading)] font-semibold text-[var(--text-primary)]">
              {m.aiConfidenceScore}%
            </p>
          </div>
        </motion.div>
        <motion.div
          className="flex items-center gap-3 relative"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          onMouseEnter={() => setEscalationHovered(true)}
          onMouseLeave={() => setEscalationHovered(false)}
        >
          <button
            type="button"
            className="w-10 h-10 rounded-[var(--radius-button)] flex items-center justify-center bg-[var(--warning)]/10 text-[var(--warning)]"
            aria-describedby={escalationHovered ? tooltipId : undefined}
            onFocus={() => setEscalationHovered(true)}
            onBlur={() => setEscalationHovered(false)}
          >
            <AlertTriangle className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">Escalation rate</p>
            <p className="text-[length:var(--typography-heading)] font-semibold text-[var(--text-primary)]">
              {m.escalationRate.toFixed(1)}%
            </p>
          </div>
          {escalationHovered && (
            <motion.div
              id={tooltipId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute left-0 top-full mt-2 z-10 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-lg text-xs text-[var(--text-secondary)] max-w-[200px]"
              role="tooltip"
            >
              Calls transferred to human agents. Lower is better.
            </motion.div>
          )}
        </motion.div>
      </div>
    </Card>
  );
}
