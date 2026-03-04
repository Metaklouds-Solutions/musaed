/**
 * Peak hours chart: calls per hour (0–23).
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';
import type { PeakHourPoint } from '../../../../shared/types/reports';

interface PeakHoursChartProps {
  points: PeakHourPoint[];
}

export function PeakHoursChart({ points }: PeakHoursChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxCount = Math.max(...points.map((p) => p.count), 1);
  const displayPoints = points;

  const totalCalls = points.reduce((s, p) => s + p.count, 0);
  if (totalCalls === 0) {
    return (
      <div className="rounded-xl card-glass p-5 min-h-[180px] flex flex-col items-center justify-center text-[var(--text-muted)]">
        <Clock className="w-10 h-10 mb-2 opacity-50" aria-hidden />
        <p className="text-sm">No call data for peak hours</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl card-glass p-5 min-h-[180px]">
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-[var(--ds-primary)]" aria-hidden />
        Peak hours
      </h3>
      <div className="flex gap-1 items-end h-24 overflow-x-auto pb-2 -mx-1">
        {displayPoints.map((p, i) => {
          const heightPct = (p.count / maxCount) * 100;
          const isHovered = hoveredIndex === i;

          return (
            <div
              key={p.hour}
              className="relative flex-1 min-w-[20px] max-w-[28px] flex flex-col items-center gap-0.5"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {isHovered && (
                <div
                  className="absolute -top-9 left-1/2 -translate-x-1/2 z-10 px-2 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-lg text-xs font-medium text-[var(--text-primary)] whitespace-nowrap"
                  role="tooltip"
                >
                  {p.label}: {p.count} call{p.count !== 1 ? 's' : ''}
                </div>
              )}
              <div className="relative w-full flex flex-col justify-end h-20 rounded-t overflow-hidden bg-[var(--bg-subtle)] border border-[var(--border-subtle)] border-b-0 min-h-6">
                <motion.div
                  className="w-full rounded-t min-h-0 bg-[linear-gradient(180deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)]"
                  initial={{ height: 0 }}
                  animate={{ height: `${p.count > 0 ? Math.max(heightPct, 4) : 0}%` }}
                  transition={{ duration: 0.3, delay: i * 0.01, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">
                {p.hour % 3 === 0 ? p.label : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
