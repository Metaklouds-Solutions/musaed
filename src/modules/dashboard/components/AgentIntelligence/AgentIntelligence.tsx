/**
 * AI performance indicators: confidence score, escalation rate. Data from adapter only.
 */

import { TrendingUp, AlertTriangle } from 'lucide-react';
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
    <div
      className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] p-5"
      style={{ minHeight: '140px' }}
    >
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
        AI performance
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--primary-glow)' }}
          >
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">
              AI confidence score
            </p>
            <p className="text-xl font-semibold text-[var(--text-primary)]">
              {m.aiConfidenceScore}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(234, 179, 8, 0.1)',
            }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: 'var(--warning)' }} />
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">
              Escalation rate
            </p>
            <p className="text-xl font-semibold text-[var(--text-primary)]">
              {m.escalationRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
