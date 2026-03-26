/**
 * Funnel visualization: stages with animated progress bars and drop-off %.
 */

import { motion } from 'motion/react';
import { EmptyState, Card, LOTTIE_ASSETS, AnimatedNumber } from '../../../../shared/ui';
import type { FunnelStage } from '../../../../shared/types';
import { GitBranch } from 'lucide-react';

interface ConversionFunnelProps {
  stages: FunnelStage[];
}

/** Renders funnel stage counts with proportional bars and drop-off context. */
export function ConversionFunnel({ stages }: ConversionFunnelProps) {
  if (stages.length === 0) {
    return (
      <Card className="p-5 min-h-[140px] metric-card">
        <EmptyState
          icon={GitBranch}
          title="No funnel data"
          description="Conversion stages will appear when data is available."
          lottieSrc={LOTTIE_ASSETS.chart}
        />
      </Card>
    );
  }

  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <Card className="p-5 min-h-[140px] metric-card">
      <h3 className="text-[var(--typography-subheading)] font-semibold text-[var(--text-primary)] mb-4">
        Conversion funnel
      </h3>
      <div className="space-y-3">
        {stages.map(({ stage, count }, i) => {
          const widthPct = (count / max) * 100;
          const prevCount = i > 0 ? stages[i - 1].count : count;
          const dropOff = i > 0 && prevCount > 0
            ? Math.round(((prevCount - count) / prevCount) * 100)
            : 0;

          return (
            <div key={stage} className="space-y-1">
              <div className="flex justify-between text-sm items-center gap-2">
                <span className="text-[var(--text-secondary)]">{stage}</span>
                <span className="flex items-center gap-2">
                  {i > 0 && dropOff > 0 && (
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {dropOff}% drop-off
                    </span>
                  )}
                  <span className="text-[var(--text-primary)] font-medium tabular-nums"><AnimatedNumber value={count} /></span>
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(135deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
