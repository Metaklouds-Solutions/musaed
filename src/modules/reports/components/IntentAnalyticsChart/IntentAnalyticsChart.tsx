/**
 * Intent analytics chart. Call intents derived from transcript keywords.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Target } from 'lucide-react';
import type { IntentBucket } from '../../../../shared/types/reports';

interface IntentAnalyticsChartProps {
  buckets: IntentBucket[];
}

const INTENT_COLORS: Record<string, string> = {
  Booking: 'var(--success)',
  Reschedule: 'var(--ds-primary)',
  Billing: 'var(--warning)',
  Complaint: 'var(--error)',
  General: 'var(--text-muted)',
};

/** Renders transcript-derived intent distribution with interactive bar tooltips. */
export function IntentAnalyticsChart({ buckets }: IntentAnalyticsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = buckets.reduce((s, b) => s + b.count, 0);
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  if (total === 0) {
    return (
      <div className="rounded-xl card-glass p-5 min-h-[180px] flex flex-col items-center justify-center text-[var(--text-muted)]">
        <Target className="w-10 h-10 mb-2 opacity-50" aria-hidden />
        <p className="text-sm">No intent data yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl card-glass p-5 min-h-[180px]">
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Target className="w-4 h-4 text-[var(--ds-primary)]" aria-hidden />
        Intent analytics
      </h3>
      <div className="flex gap-3 items-end h-24">
        {buckets.map((b, i) => {
          const heightPct = (b.count / maxCount) * 100;
          const isHovered = hoveredIndex === i;
          const color = INTENT_COLORS[b.label] ?? 'var(--text-muted)';

          return (
            <div
              key={b.label}
              className="relative flex-1 min-w-0 flex flex-col items-center gap-1.5"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {isHovered && (
                <div
                  className="absolute -top-9 left-1/2 -translate-x-1/2 z-10 px-2 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-lg text-xs font-medium text-[var(--text-primary)] whitespace-nowrap"
                  role="tooltip"
                >
                  {b.count} ({b.percentage}%)
                </div>
              )}
              <div className="relative w-full flex flex-col justify-end h-20 rounded-t overflow-hidden bg-[var(--bg-subtle)] border border-[var(--border-subtle)] border-b-0">
                <motion.div
                  className="w-full rounded-t min-h-0"
                  style={{ backgroundColor: color }}
                  initial={{ height: 0 }}
                  animate={{ height: `${b.count > 0 ? Math.max(heightPct, 6) : 0}%` }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
              <span className="text-xs font-medium text-[var(--text-secondary)] truncate w-full text-center">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
