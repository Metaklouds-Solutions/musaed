/**
 * AI performance: escalation rate with tooltip.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { Card, AnimatedNumber } from '../../../../shared/ui';
import type { DashboardMetrics } from '../../../../shared/types';

const EMPTY_AI_METRICS: Pick<DashboardMetrics, 'escalationRate'> = {
  escalationRate: 0,
};

interface AgentIntelligenceProps {
  metrics: DashboardMetrics | null | undefined;
}

/** Renders AI escalation rate with an accessible tooltip. */
export function AgentIntelligence({ metrics }: AgentIntelligenceProps) {
  const m = metrics ?? EMPTY_AI_METRICS;
  const [escalationHovered, setEscalationHovered] = useState(false);
  const tooltipId = 'agent-intelligence-escalation-tooltip';

  return (
    <Card className="p-5 min-h-[140px]">
      <h3 className="text-[var(--typography-subheading)] font-semibold text-[var(--text-primary)] mb-4">
        AI performance
      </h3>
      <motion.div
        className="flex items-center gap-3 relative"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
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
            <AnimatedNumber value={m.escalationRate} decimals={1} format={(n) => `${n.toFixed(1)}%`} />
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
    </Card>
  );
}
