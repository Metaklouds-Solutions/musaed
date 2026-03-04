/**
 * Time period comparison: current vs previous (e.g. this week vs last week).
 */

import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PerformanceMetrics } from '../../../../shared/types/reports';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function changePercent(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

interface PeriodComparisonProps {
  current: PerformanceMetrics;
  previous: PerformanceMetrics;
  label: string;
}

const metricConfig: Array<{
  key: keyof PerformanceMetrics;
  label: string;
  format: (v: number) => string;
  higherIsBetter: boolean;
}> = [
  { key: 'totalCalls', label: 'Calls', format: (v) => v.toString(), higherIsBetter: true },
  { key: 'totalBookings', label: 'Bookings', format: (v) => v.toString(), higherIsBetter: true },
  { key: 'conversionRate', label: 'Conversion', format: (v) => `${v}%`, higherIsBetter: true },
  { key: 'escalationRate', label: 'Escalation', format: (v) => `${v}%`, higherIsBetter: false },
  { key: 'avgDurationSec', label: 'Avg duration', format: formatDuration, higherIsBetter: false },
];

/** Renders current-vs-previous period KPI deltas with directional indicators. */
export function PeriodComparison({ current, previous, label }: PeriodComparisonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-[var(--radius-card)] card-glass p-5"
    >
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
        Period comparison
      </h3>
      <p className="text-sm text-[var(--text-muted)] mb-4">{label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {metricConfig.map(({ key, label: l, format, higherIsBetter }) => {
          const curr = current[key];
          const prev = previous[key];
          if (typeof curr !== 'number' || typeof prev !== 'number') return null;
          const change = changePercent(curr, prev);
          const isPositive = change !== null && (higherIsBetter ? change > 0 : change < 0);
          const isNegative = change !== null && (higherIsBetter ? change < 0 : change > 0);
          return (
            <div
              key={key}
              className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4"
            >
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                {l}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                  {format(curr)}
                </span>
                {change !== null && change !== 0 && (
                  <span
                    className={cn(
                      'flex items-center gap-0.5 text-xs font-medium',
                      isPositive && 'text-[var(--success)]',
                      isNegative && 'text-[var(--error)]'
                    )}
                  >
                    {isPositive && <TrendingUp size={14} aria-hidden />}
                    {isNegative && <TrendingDown size={14} aria-hidden />}
                    {change > 0 ? '+' : ''}{change}%
                  </span>
                )}
                {change === 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-[var(--text-muted)]">
                    <Minus size={14} aria-hidden />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
