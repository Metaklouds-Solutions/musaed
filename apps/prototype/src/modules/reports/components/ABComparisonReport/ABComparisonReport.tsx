/**
 * A/B test comparison: outcomes by agent version.
 */

import { motion } from 'motion/react';
import { TestTube } from 'lucide-react';
import type { ABTestOutcomeRow } from '../../../../shared/types/reports';

interface ABComparisonReportProps {
  rows: ABTestOutcomeRow[];
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function ABComparisonReport({ rows }: ABComparisonReportProps) {
  if (rows.length === 0) return null;

  const hasMultipleVersions = rows.length > 1;
  if (!hasMultipleVersions && rows[0]?.version === 'default') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="rounded-[var(--radius-card)] card-glass p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <TestTube className="w-5 h-5 text-[var(--ds-primary)]" aria-hidden />
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          A/B Test Comparison
        </h3>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Outcomes by agent version. Configure A/B split in Agent settings.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="text-left py-3 px-2 font-medium text-[var(--text-secondary)]">Version</th>
              <th className="text-right py-3 px-2 font-medium text-[var(--text-secondary)]">Calls</th>
              <th className="text-right py-3 px-2 font-medium text-[var(--text-secondary)]">Booked</th>
              <th className="text-right py-3 px-2 font-medium text-[var(--text-secondary)]">Escalated</th>
              <th className="text-right py-3 px-2 font-medium text-[var(--text-secondary)]">Failed</th>
              <th className="text-right py-3 px-2 font-medium text-[var(--text-secondary)]">Conversion</th>
              <th className="text-right py-3 px-2 font-medium text-[var(--text-secondary)]">Avg duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <motion.tr
                key={row.version}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-elevated)]/30"
              >
                <td className="py-3 px-2">
                  <span className="font-medium text-[var(--text-primary)]">Version {row.version}</span>
                </td>
                <td className="py-3 px-2 text-right tabular-nums text-[var(--text-primary)]">
                  {row.totalCalls}
                </td>
                <td className="py-3 px-2 text-right tabular-nums text-[var(--success)]">
                  {row.booked}
                </td>
                <td className="py-3 px-2 text-right tabular-nums text-[var(--warning)]">
                  {row.escalated}
                </td>
                <td className="py-3 px-2 text-right tabular-nums text-[var(--error)]">
                  {row.failed}
                </td>
                <td className="py-3 px-2 text-right tabular-nums text-[var(--text-primary)]">
                  {row.conversionRate}%
                </td>
                <td className="py-3 px-2 text-right tabular-nums text-[var(--text-secondary)]">
                  {formatDuration(row.avgDurationSec)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
