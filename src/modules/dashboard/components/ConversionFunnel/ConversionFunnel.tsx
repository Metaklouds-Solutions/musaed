/**
 * Funnel visualization: stages from adapter. No hardcoded numbers.
 * EmptyState when no stages (e.g. API mode returns empty array).
 */

import { EmptyState } from '../../../../shared/ui';
import type { FunnelStage } from '../../../../shared/types';
import { GitBranch } from 'lucide-react';

interface ConversionFunnelProps {
  stages: FunnelStage[];
}

export function ConversionFunnel({ stages }: ConversionFunnelProps) {
  if (stages.length === 0) {
    return (
      <div
        className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] p-5"
        style={{ minHeight: '140px' }}
      >
        <EmptyState
          icon={GitBranch}
          title="No funnel data"
          description="Conversion stages will appear when data is available."
        />
      </div>
    );
  }
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div
      className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] p-5"
      style={{ minHeight: '140px' }}
    >
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
        Conversion funnel
      </h3>
      <div className="space-y-3">
        {stages.map(({ stage, count }) => (
          <div key={stage} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>{stage}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {count}
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]"
              style={{ background: 'var(--bg-subtle)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(count / max) * 100}%`,
                  background: 'var(--primary)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
