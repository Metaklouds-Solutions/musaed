/**
 * Tenant dashboard top KPIs.
 */

import { motion } from 'motion/react';
import { TenantKpiCard } from './TenantKpiCard';
import type { TenantKpis } from '../../../../shared/types';

interface TenantKpiCardsProps {
  kpis: TenantKpis;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Renders tenant dashboard KPI card grid with booking and usage highlights. */
export function TenantKpiCards({ kpis }: TenantKpiCardsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Key Metrics</h2>
        <p className="text-xs text-[var(--text-muted)]">Fast snapshot of call flow, bookings, and operational load</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <TenantKpiCard label="Calls Today" value={kpis.callsToday} animateValue={kpis.callsToday} />
        <TenantKpiCard label="Calls 7d" value={kpis.calls7d} animateValue={kpis.calls7d} />
        <TenantKpiCard label="Booked" value={kpis.appointmentsBooked} animateValue={kpis.appointmentsBooked} trend="up" />
        <TenantKpiCard label="Escalations" value={kpis.escalations} animateValue={kpis.escalations} />
        <TenantKpiCard label="Failed" value={kpis.failedCalls} animateValue={kpis.failedCalls} />
        <TenantKpiCard label="Avg Duration" value={formatDuration(kpis.avgDurationSec)} animateValue={kpis.avgDurationSec} format={formatDuration} />
        <TenantKpiCard label="Top Outcome" value={kpis.topOutcome} />
        <TenantKpiCard label="Minutes Used" value={kpis.minutesUsed.toLocaleString()} animateValue={kpis.minutesUsed} format={(n) => n.toLocaleString()} />
        <TenantKpiCard label="Credits" value={kpis.creditBalance} animateValue={kpis.creditBalance} />
      </div>
    </motion.section>
  );
}
