/**
 * Outcomes over time: booked / escalated / failed by day.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import type { OutcomesByDay } from '../../../../shared/types/reports';

interface OutcomesOverTimeChartProps {
  data: OutcomesByDay[];
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Renders daily booked/escalated/failed stacked bars for recent trend window. */
export function OutcomesOverTimeChart({ data }: OutcomesOverTimeChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const displayData = data.length > 7 ? data.slice(-7) : data;

  if (data.length === 0) {
    return (
      <div className="rounded-xl card p-5 min-h-[180px] flex flex-col items-center justify-center text-[var(--text-muted)]">
        <TrendingUp className="w-10 h-10 mb-2 opacity-50" aria-hidden />
        <p className="text-sm">No outcomes data yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl card p-5 min-h-[180px]">
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-[var(--ds-primary)]" aria-hidden />
        Outcomes over time
      </h3>
      <div className="flex gap-2 items-end justify-between h-28 overflow-x-auto pb-2">
        {displayData.map((d, i) => {
          const isHovered = hoveredIndex === i;
          const bookedPct = (d.booked / maxTotal) * 100;
          const escalatedPct = (d.escalated / maxTotal) * 100;
          const failedPct = (d.failed / maxTotal) * 100;

          return (
            <div
              key={d.date}
              className="relative flex-1 min-w-[40px] flex flex-col items-center gap-1"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {isHovered && (
                <div
                  className="absolute -top-16 left-1/2 -translate-x-1/2 z-10 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-lg text-xs font-medium text-[var(--text-primary)] space-y-0.5"
                  role="tooltip"
                >
                  <div className="text-[var(--success)]">Booked: {d.booked}</div>
                  <div className="text-[var(--warning)]">Escalated: {d.escalated}</div>
                  <div className="text-[var(--error)]">Failed: {d.failed}</div>
                </div>
              )}
              <div className="w-full flex gap-0.5 items-end justify-center h-20 rounded-t overflow-hidden bg-[var(--bg-subtle)] border border-[var(--border-subtle)] border-b-0 p-1">
                <motion.div
                  className="flex-1 min-w-2 rounded-sm bg-[var(--success)]"
                  initial={{ height: 0 }}
                  animate={{ height: `${bookedPct}%` }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                />
                <motion.div
                  className="flex-1 min-w-2 rounded-sm bg-[var(--warning)]"
                  initial={{ height: 0 }}
                  animate={{ height: `${escalatedPct}%` }}
                  transition={{ duration: 0.4, delay: i * 0.05 + 0.05 }}
                />
                <motion.div
                  className="flex-1 min-w-2 rounded-sm bg-[var(--error)]"
                  initial={{ height: 0 }}
                  animate={{ height: `${failedPct}%` }}
                  transition={{ duration: 0.4, delay: i * 0.05 + 0.1 }}
                />
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {formatShortDate(d.date)}
              </span>
              <span className="text-xs font-medium text-[var(--text-primary)] tabular-nums">
                {d.total}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3 pt-3 border-t border-[var(--border-subtle)]/50">
        <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <span className="w-2 h-2 rounded-sm bg-[var(--success)]" />
          Booked
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <span className="w-2 h-2 rounded-sm bg-[var(--warning)]" />
          Escalated
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <span className="w-2 h-2 rounded-sm bg-[var(--error)]" />
          Failed
        </span>
      </div>
    </div>
  );
}
