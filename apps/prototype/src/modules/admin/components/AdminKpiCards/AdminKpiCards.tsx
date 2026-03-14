/**
 * Admin dashboard platform pulse: 8 KPI cards (real data only).
 */

import { motion } from 'motion/react';
import { AdminKpiCard } from './AdminKpiCard';
import type { AdminPulseKpis } from '../../../../shared/types';

const CARD_ANIMATION = { duration: 0.3 };

interface AdminKpiCardsProps {
  kpis: AdminPulseKpis;
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const NO_DATA = '—';

/** Renders platform pulse KPIs as a grid of 8 cards. */
export function AdminKpiCards({ kpis }: AdminKpiCardsProps) {
  const hasCalls = kpis.calls7d > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={CARD_ANIMATION}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Platform Pulse</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminKpiCard
          label="Active Tenants"
          value={kpis.activeTenants}
          animateValue={kpis.activeTenants}
          trend={kpis.activeTenants > 0 ? 'up' : undefined}
        />
        <AdminKpiCard
          label="Active Agents"
          value={kpis.activeAgents}
          animateValue={kpis.activeAgents}
          trend={kpis.activeAgents > 0 ? 'up' : undefined}
        />
        <AdminKpiCard
          label="Calls Today"
          value={kpis.callsToday}
          animateValue={kpis.callsToday}
          trend={kpis.callsToday > 0 ? 'up' : undefined}
        />
        <AdminKpiCard
          label="Calls 7d"
          value={kpis.calls7d}
          animateValue={kpis.calls7d}
          trend={kpis.calls7d > 0 ? 'up' : undefined}
        />
        <AdminKpiCard
          label="Booked %"
          value={hasCalls ? `${kpis.bookedPercent.toFixed(1)}%` : NO_DATA}
          animateValue={hasCalls ? kpis.bookedPercent : undefined}
          decimals={1}
          format={(n) => `${n.toFixed(1)}%`}
          trend={kpis.bookedPercent > 0 ? 'up' : undefined}
        />
        <AdminKpiCard
          label="Escalated %"
          value={hasCalls ? `${kpis.escalationPercent.toFixed(1)}%` : NO_DATA}
          animateValue={hasCalls ? kpis.escalationPercent : undefined}
          decimals={1}
          format={(n) => `${n.toFixed(1)}%`}
          trend={kpis.escalationPercent > 5 ? 'down' : undefined}
        />
        <AdminKpiCard
          label="AI Minutes"
          value={hasCalls ? kpis.aiMinutesUsed.toLocaleString() : NO_DATA}
          animateValue={hasCalls ? kpis.aiMinutesUsed : undefined}
          format={(n) => n.toLocaleString()}
          trend={hasCalls && kpis.aiMinutesUsed > 0 ? 'up' : undefined}
        />
        <AdminKpiCard
          label="Est. Cost"
          value={hasCalls ? formatUsd(kpis.estimatedCostUsd) : NO_DATA}
          animateValue={hasCalls ? kpis.estimatedCostUsd : undefined}
          format={formatUsd}
        />
      </div>
    </motion.section>
  );
}
