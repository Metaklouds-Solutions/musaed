/**
 * AI performance indicators: confidence score, escalation rate. Data from adapter only.
 */

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

export function AgentIntelligence({ metrics }: AgentIntelligenceProps) {
  const m = metrics ?? EMPTY_AI_METRICS;
  return (
    <Card className="p-5 min-h-[140px]">
      <h3 className="text-[var(--typography-subheading)] font-semibold text-[var(--text-primary)] mb-4">
        AI performance
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-button)] flex items-center justify-center bg-[var(--primary-glow)] text-[var(--ds-primary)]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">AI confidence score</p>
            <p className="text-[length:var(--typography-heading)] font-semibold text-[var(--text-primary)]">{m.aiConfidenceScore}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-button)] flex items-center justify-center bg-[var(--warning)]/10 text-[var(--warning)]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">Escalation rate</p>
            <p className="text-[length:var(--typography-heading)] font-semibold text-[var(--text-primary)]">{m.escalationRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
