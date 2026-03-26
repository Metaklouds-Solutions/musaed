/**
 * Agent performance metrics for reports.
 */

import { motion } from 'motion/react';
import type { PerformanceMetrics as PerformanceMetricsType } from '../../../../shared/types/reports';

interface PerformanceMetricsProps {
  metrics: PerformanceMetricsType;
}

function formatDuration(sec: number, compact = false): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (compact && sec < 60) return `${s}s`;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const metricConfig: Array<{
  key: keyof PerformanceMetricsType;
  label: string;
  format: (v: number) => string;
}> = [
  { key: 'totalCalls', label: 'Total calls', format: (v) => v.toString() },
  { key: 'totalBookings', label: 'Bookings', format: (v) => v.toString() },
  { key: 'avgDurationSec', label: 'Avg duration', format: (v) => formatDuration(v, v < 60) },
  { key: 'conversionRate', label: 'Conversion rate', format: (v) => `${v}%` },
  { key: 'escalationRate', label: 'Escalation rate', format: (v) => `${v}%` },
  { key: 'sentimentAvg', label: 'Sentiment avg', format: (v) => v.toFixed(2) },
];

/** Renders top-level performance KPIs for calls, conversion, and sentiment. */
export function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  return (
    <div className="rounded-[var(--radius-card)] card-accent p-5">
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
        Agent performance
      </h3>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}
      >
        {metricConfig.map(({ key, label, format }, i) => {
          const value = metrics[key];
          if (typeof value !== 'number') return null;
          const formatted = format(value);
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-lg panel-soft p-4 min-w-0 overflow-hidden"
            >
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide truncate">
                {label}
              </p>
              <p
                className="text-base sm:text-lg lg:text-xl font-bold text-[var(--text-primary)] mt-1 tabular-nums truncate"
                title={formatted}
              >
                {formatted}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
