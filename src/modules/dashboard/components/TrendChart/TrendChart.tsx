/**
 * Trend chart: bookings over time from adapter. No revenue; no hardcoded numbers.
 */

import { EmptyState, Card } from '../../../../shared/ui';
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
      <Card className="p-5 min-h-[200px]">
        <EmptyState
          icon={TrendingUp}
          title="No trend data yet"
          description="Bookings trend will appear when booking data is available."
        />
      </Card>
    );
  }
  const maxBookings = Math.max(...points.map((p) => p.bookings), 1);
  const barVars = points
    .map(
      (p, i) =>
        `.trend-chart-bar-${i}{--bar-height:${(p.bookings / maxBookings) * 100}%;--bar-min-height:${p.bookings > 0 ? '4px' : '0'}}`,
    )
    .join('');
  return (
    <Card className="p-5 min-h-[200px]">
      <style dangerouslySetInnerHTML={{ __html: barVars }} />
      <h3 className="font-semibold mb-4 text-(--text-primary)">
        Bookings trend
      </h3>
      <div className="flex gap-2 items-end justify-between h-32">
        {points.map((p, i) => (
          <div key={p.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t border border-(--border-subtle) border-b-0 flex flex-col justify-end h-[80%] min-h-6 bg-(--bg-subtle)">
              <div
                className={`trend-chart-bar-inner trend-chart-bar-${i} w-full rounded-t transition-all duration-300 min-h-0 bg-[linear-gradient(180deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)]`}
              />
            </div>
            <span className="text-xs text-(--text-muted)">
              {formatShortDate(p.date)}
            </span>
            <span className="text-xs font-medium text-(--text-primary)">
              {p.bookings}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
