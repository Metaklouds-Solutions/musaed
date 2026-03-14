/**
 * Tenant dashboard top KPIs. Consolidated to 6 focused cards.
 */

import { motion } from 'motion/react';
import { TenantKpiCard } from './TenantKpiCard';
import type { TenantKpis } from '../../../../shared/types';
import type { DashboardMetrics } from '../../../../shared/types';

interface TenantKpiCardsProps {
  kpis: TenantKpis;
  metrics: DashboardMetrics;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Renders tenant dashboard KPI card grid: 6 focused metrics. */
export function TenantKpiCards({ kpis, metrics }: TenantKpiCardsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Key Metrics</h2>
        <p className="text-xs text-[var(--text-muted)]">Call flow, bookings, and conversion</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        <TenantKpiCard label="Calls Today" value={kpis.callsToday} animateValue={kpis.callsToday} />
        <TenantKpiCard label="Calls 7d" value={kpis.calls7d} animateValue={kpis.calls7d} />
        <TenantKpiCard label="Booked" value={kpis.appointmentsBooked} animateValue={kpis.appointmentsBooked} trend="up" />
        <TenantKpiCard label="Escalation Rate" value={`${metrics.escalationRate.toFixed(1)}%`} animateValue={metrics.escalationRate} decimals={1} format={(n) => `${n.toFixed(1)}%`} />
        <TenantKpiCard label="Avg Duration" value={formatDuration(kpis.avgDurationSec)} animateValue={kpis.avgDurationSec} format={formatDuration} />
        <TenantKpiCard label="Conversion Rate" value={`${metrics.conversionRate.toFixed(1)}%`} animateValue={metrics.conversionRate} decimals={1} format={(n) => `${n.toFixed(1)}%`} />
      </div>
    </motion.section>
  );
}
