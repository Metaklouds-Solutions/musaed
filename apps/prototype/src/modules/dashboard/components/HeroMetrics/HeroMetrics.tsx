/**
 * Hero metrics: total bookings, conversion, calls handled, escalation, cost saved.
 * Uses StatCardEnhanced with sparklines and trend indicators.
 */

import { StatCardEnhanced } from '../../../../shared/ui';
import type { DashboardMetrics, TrendPoint } from '../../../../shared/types';

interface HeroMetricsProps {
  metrics: DashboardMetrics | null | undefined;
  trend?: TrendPoint[];
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

function deriveTrend(points: TrendPoint[]): 'up' | 'down' | 'neutral' {
  if (points.length < 2) return 'neutral';
  const first = points[0].bookings;
  const last = points[points.length - 1].bookings;
  if (last > first) return 'up';
  if (last < first) return 'down';
  return 'neutral';
}

const EMPTY_METRICS: DashboardMetrics = {
  totalBookings: 0,
  conversionRate: 0,
  callsHandled: 0,
  escalationRate: 0,
  costSaved: 0,
  aiConfidenceScore: 0,
};

/** Renders tenant dashboard KPI cards with trend-derived sparkline context. */
export function HeroMetrics({ metrics, trend = [] }: HeroMetricsProps) {
  const m = metrics ?? EMPTY_METRICS;
  const sparklineData = trend.length > 0 ? trend.map((p) => p.bookings) : undefined;
  const trendDir = deriveTrend(trend);

  const cards = [
    { label: 'Total bookings', value: m.totalBookings, animateValue: m.totalBookings, trend: trendDir, sparklineData },
    { label: 'Conversion rate', value: formatPercent(m.conversionRate), animateValue: m.conversionRate, decimals: 1, format: formatPercent },
    { label: 'Calls handled', value: m.callsHandled, animateValue: m.callsHandled },
    { label: 'Escalation rate', value: formatPercent(m.escalationRate), animateValue: m.escalationRate, decimals: 1, format: formatPercent },
    { label: 'Cost saved', value: formatCurrency(m.costSaved), animateValue: m.costSaved, format: formatCurrency, trend: trendDir, sparklineData },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <StatCardEnhanced
          key={card.label}
          label={card.label}
          value={card.value}
          animateValue={card.animateValue}
          format={card.format}
          decimals={card.decimals}
          trend={card.trend}
          sparklineData={card.sparklineData}
        />
      ))}
    </div>
  );
}
