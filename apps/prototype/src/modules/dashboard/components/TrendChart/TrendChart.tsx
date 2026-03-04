/**
 * Trend chart: bookings over time with bar hover, tooltip, animated bars.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { EmptyState, Card, LOTTIE_ASSETS } from '../../../../shared/ui';
import type { TrendPoint } from '../../../../shared/types';
import { TrendingUp } from 'lucide-react';

interface TrendChartProps {
  points: TrendPoint[];
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TrendChart({ points }: TrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <Card variant="glass" className="p-5 min-h-[200px]">
        <EmptyState
          icon={TrendingUp}
          title="No trend data yet"
          description="Bookings trend will appear when booking data is available."
          lottieSrc={LOTTIE_ASSETS.chart}
        />
      </Card>
    );
  }

  const maxBookings = Math.max(...points.map((p) => p.bookings), 1);
  const displayPoints = points.length > 7 ? points.slice(-7) : points;

  return (
    <Card variant="glass" className="p-5 min-h-[200px]">
      <h3 className="font-semibold mb-4 text-[var(--text-primary)]">
        Bookings trend
      </h3>
      <div className="flex gap-2 items-end justify-between h-32 overflow-x-auto pb-2">
        {displayPoints.map((p, i) => {
          const heightPct = (p.bookings / maxBookings) * 100;
          const isHovered = hoveredIndex === i;

          return (
            <div
              key={p.date}
              className="flex-1 min-w-[32px] flex flex-col items-center gap-1 relative group"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(i)}
              onBlur={() => setHoveredIndex(null)}
              tabIndex={0}
              aria-describedby={isHovered ? `bookings-tooltip-${i}` : undefined}
            >
              {isHovered && (
                <div
                  id={`bookings-tooltip-${i}`}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 px-2 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-lg text-xs font-medium text-[var(--text-primary)] whitespace-nowrap"
                  role="tooltip"
                >
                  {p.bookings} booking{p.bookings !== 1 ? 's' : ''}
                </div>
              )}
              <div className="w-full rounded-t border border-[var(--border-subtle)] border-b-0 flex flex-col justify-end h-[80%] min-h-6 bg-[var(--bg-subtle)] overflow-hidden">
                <motion.div
                  className="w-full rounded-t min-h-0 bg-[linear-gradient(180deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)]"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPct, p.bookings > 0 ? 4 : 0)}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    boxShadow: isHovered ? '0 0 12px rgba(124, 92, 255, 0.4)' : undefined,
                  }}
                />
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {formatShortDate(p.date)}
              </span>
              <span className="text-xs font-medium text-[var(--text-primary)] tabular-nums">
                {p.bookings}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
