/**
 * Funnel visualization: stages from adapter. No hardcoded numbers.
 * EmptyState when no stages (e.g. API mode returns empty array).
 */

import { EmptyState, Card } from '../../../../shared/ui';
import type { FunnelStage } from '../../../../shared/types';
import { GitBranch } from 'lucide-react';

interface ConversionFunnelProps {
  stages: FunnelStage[];
}

export function ConversionFunnel({ stages }: ConversionFunnelProps) {
  if (stages.length === 0) {
    return (
      <Card className="p-5 min-h-[140px]">
        <EmptyState
          icon={GitBranch}
          title="No funnel data"
          description="Conversion stages will appear when data is available."
        />
      </Card>
    );
  }
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <Card className="p-5 min-h-[140px]">
      <h3 className="text-[var(--typography-subheading)] font-semibold text-[var(--text-primary)] mb-4">
        Conversion funnel
      </h3>
      <div className="space-y-3">
        {stages.map(({ stage, count }) => (
          <div key={stage} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">{stage}</span>
              <span className="text-[var(--text-primary)] font-medium">{count}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
              <div
                className="h-full rounded-full transition-all duration-300 bg-[linear-gradient(135deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)]"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
