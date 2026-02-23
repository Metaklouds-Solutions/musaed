/**
 * Trend chart: bookings over time from adapter. No revenue; no hardcoded numbers.
 */

import { EmptyState } from '../../../../shared/ui';
import type { TrendPoint } from '../../../../shared/types';
import { TrendingUp } from 'lucide-react';

interface TrendChartProps {
  points: TrendPoint[];
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TrendChart({ points }: TrendChartProps) {
  if (points.length === 0) {
    return (
      <div
        className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] p-5"
        style={{ minHeight: '200px' }}
      >
        <EmptyState
          icon={TrendingUp}
          title="No trend data yet"
          description="Bookings trend will appear when booking data is available."
        />
      </div>
    );
  }
  const maxBookings = Math.max(...points.map((p) => p.bookings), 1);
  return (
    <div
      className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] p-5"
      style={{ minHeight: '200px' }}
    >
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
        Bookings trend
      </h3>
      <div className="flex gap-2 items-end justify-between h-32">
        {points.map((p) => (
          <div key={p.date} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t border border-[var(--border-subtle)] border-b-0 flex flex-col justify-end"
              style={{
                height: '80%',
                minHeight: 24,
                background: 'var(--bg-subtle)',
              }}
            >
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{
                  height: `${(p.bookings / maxBookings) * 100}%`,
                  minHeight: p.bookings > 0 ? 4 : 0,
                  background: 'var(--primary)',
                }}
              />
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              {formatShortDate(p.date)}
            </span>
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {p.bookings}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
