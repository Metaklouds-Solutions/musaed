/**
 * Hero metrics: total bookings, conversion, calls handled, escalation, cost saved. Adapter only; no revenue attribution.
 */

import { StatCard } from '../../../../shared/ui';
import type { DashboardMetrics } from '../../../../shared/types';

interface HeroMetricsProps {
  metrics: DashboardMetrics | null | undefined;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

const EMPTY_METRICS: DashboardMetrics = {
  totalBookings: 0,
  conversionRate: 0,
  callsHandled: 0,
  escalationRate: 0,
  costSaved: 0,
  aiConfidenceScore: 0,
};

export function HeroMetrics({ metrics }: HeroMetricsProps) {
  const m = metrics ?? EMPTY_METRICS;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard label="Total bookings" value={m.totalBookings} />
      <StatCard label="Conversion rate" value={formatPercent(m.conversionRate)} />
      <StatCard label="Calls handled" value={m.callsHandled} />
      <StatCard label="Escalation rate" value={formatPercent(m.escalationRate)} />
      <StatCard label="Cost saved" value={formatCurrency(m.costSaved)} />
    </div>
  );
}
