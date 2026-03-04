/**
 * Agent performance metrics for reports.
 */

import { motion } from 'motion/react';
import type { PerformanceMetrics as PerformanceMetricsType } from '../../../../shared/types/reports';

interface PerformanceMetricsProps {
  metrics: PerformanceMetricsType;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const metricConfig: Array<{
  key: keyof PerformanceMetricsType;
  label: string;
  format: (v: number) => string;
}> = [
  { key: 'totalCalls', label: 'Total calls', format: (v) => v.toString() },
  { key: 'totalBookings', label: 'Bookings', format: (v) => v.toString() },
  { key: 'avgDurationSec', label: 'Avg duration', format: formatDuration },
  { key: 'conversionRate', label: 'Conversion rate', format: (v) => `${v}%` },
  { key: 'escalationRate', label: 'Escalation rate', format: (v) => `${v}%` },
  { key: 'sentimentAvg', label: 'Sentiment avg', format: (v) => v.toFixed(2) },
];

/** Renders top-level performance KPIs for calls, conversion, and sentiment. */
export function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  return (
    <div className="rounded-[var(--radius-card)] card-glass p-5">
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
        Agent performance
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {metricConfig.map(({ key, label, format }, i) => {
          const value = metrics[key];
          if (typeof value !== 'number') return null;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4"
            >
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                {label}
              </p>
              <p className="text-xl font-bold text-[var(--text-primary)] mt-1 tabular-nums">
                {format(value)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
