/**
 * Outcome breakdown: Booked / Escalated / Failed chart or table.
 */

import { motion } from 'motion/react';
import type { OutcomeBreakdown as OutcomeBreakdownType } from '../../../../shared/types/reports';

interface OutcomeBreakdownProps {
  outcomes: OutcomeBreakdownType[];
}

const outcomeConfig: Record<OutcomeBreakdownType['outcome'], { label: string; color: string }> = {
  booked: { label: 'Booked', color: 'var(--success)' },
  escalated: { label: 'Escalated', color: 'var(--warning)' },
  failed: { label: 'Failed', color: 'var(--error)' },
  info_only: { label: 'Info Only', color: 'var(--text-muted)' },
};

/** Renders booked/escalated/failed outcome distribution bars and totals. */
export function OutcomeBreakdown({ outcomes }: OutcomeBreakdownProps) {
  const total = outcomes.reduce((s, o) => s + o.count, 0);
  const maxCount = Math.max(...outcomes.map((o) => o.count), 1);

  return (
    <div className="rounded-[var(--radius-card)] card-accent p-5">
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
        Call outcomes
      </h3>
      <div className="space-y-3">
        {outcomes.map(({ outcome, count, percentage }, i) => {
          const config = outcomeConfig[outcome];
          const widthPct = (count / maxCount) * 100;
          return (
            <div key={outcome} className="space-y-1.5">
              <div className="flex justify-between text-sm items-center gap-2">
                <span className="text-[var(--text-secondary)]">{config.label}</span>
                <span className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)] font-medium tabular-nums">{count}</span>
                  <span className="text-xs text-[var(--text-muted)]">({percentage}%)</span>
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: config.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {total > 0 && (
        <p className="text-xs text-[var(--text-muted)] mt-3">
          Total calls: {total}
        </p>
      )}
    </div>
  );
}
