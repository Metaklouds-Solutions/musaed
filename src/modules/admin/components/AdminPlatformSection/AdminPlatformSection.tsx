/**
 * Admin platform section: tenants, agents, minutes, calls, bookings, escalation rate.
 */

import { StatCard } from '../../../../shared/ui';
import type { AdminOverviewMetrics } from '../../../../shared/types';

interface AdminPlatformSectionProps {
  metrics: AdminOverviewMetrics;
}

export function AdminPlatformSection({ metrics }: AdminPlatformSectionProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Platform usage
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        <StatCard label="Active tenants" value={metrics.activeTenants} />
        <StatCard label="Active agents" value={metrics.activeAgents} />
        <StatCard label="AI minutes used" value={metrics.aiMinutesUsed.toLocaleString()} />
        <StatCard label="Platform calls handled" value={metrics.platformCallsHandled} />
        <StatCard label="Platform bookings created" value={metrics.platformBookingsCreated} />
        <StatCard label="Platform conversion rate" value={`${metrics.platformConversionRate.toFixed(1)}%`} />
        <StatCard label="Escalation rate" value={`${metrics.escalationRate.toFixed(1)}%`} />
      </div>
    </section>
  );
}
