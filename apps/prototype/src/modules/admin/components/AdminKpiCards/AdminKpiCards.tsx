/**
 * Admin dashboard top KPIs. Extracts each KPI as small card.
 */

import { motion } from 'motion/react';
import { AdminKpiCard } from './AdminKpiCard';
import type { AdminKpis } from '../../../../shared/types';

const CARD_ANIMATION = { duration: 0.3 };

interface AdminKpiCardsProps {
  kpis: AdminKpis;
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

/** Renders top KPIs as a grid of cards. */
export function AdminKpiCards({ kpis }: AdminKpiCardsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={CARD_ANIMATION}
      className="space-y-4"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Top KPIs</h2>
        <p className="text-xs text-[var(--text-muted)]">Live platform pulse across growth, quality, and spend</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <AdminKpiCard label="Total Tenants" value={kpis.totalTenants} animateValue={kpis.totalTenants} />
        <AdminKpiCard label="Active" value={kpis.activeTenants} animateValue={kpis.activeTenants} />
        <AdminKpiCard label="Trial" value={kpis.trialTenants} animateValue={kpis.trialTenants} />
        <AdminKpiCard label="Suspended" value={kpis.suspendedTenants} animateValue={kpis.suspendedTenants} />
        <AdminKpiCard label="Calls Today" value={kpis.callsToday} animateValue={kpis.callsToday} />
        <AdminKpiCard label="Calls 7d" value={kpis.calls7d} animateValue={kpis.calls7d} />
        <AdminKpiCard label="Booked %" value={`${kpis.bookedPercent.toFixed(1)}%`} animateValue={kpis.bookedPercent} decimals={1} format={(n) => `${n.toFixed(1)}%`} trend="up" />
        <AdminKpiCard label="Escalation %" value={`${kpis.escalationPercent.toFixed(1)}%`} animateValue={kpis.escalationPercent} decimals={1} format={(n) => `${n.toFixed(1)}%`} trend={kpis.escalationPercent > 10 ? 'down' : 'neutral'} />
        <AdminKpiCard label="Failed %" value={`${kpis.failedPercent.toFixed(1)}%`} animateValue={kpis.failedPercent} decimals={1} format={(n) => `${n.toFixed(1)}%`} trend={kpis.failedPercent > 20 ? 'down' : 'neutral'} />
        <AdminKpiCard label="Total Cost" value={formatUsd(kpis.totalCostUsd)} animateValue={kpis.totalCostUsd} format={formatUsd} />
      </div>
    </motion.section>
  );
}
