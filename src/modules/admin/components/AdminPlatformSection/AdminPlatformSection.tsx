/**
 * Admin platform section: tenants, agents, minutes, calls, bookings, escalation rate.
 * Uses StatCardEnhanced with trend indicators.
 */

import { StatCardEnhanced } from '../../../../shared/ui';
import type { AdminOverviewMetrics } from '../../../../shared/types';

interface AdminPlatformSectionProps {
  metrics: AdminOverviewMetrics;
}

/** Renders platform usage KPIs for active footprint and funnel throughput. */
export function AdminPlatformSection({ metrics }: AdminPlatformSectionProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Platform usage
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCardEnhanced label="Active tenants" value={metrics.activeTenants} />
        <StatCardEnhanced label="Active agents" value={metrics.activeAgents} />
        <StatCardEnhanced
          label="AI minutes used"
          value={metrics.aiMinutesUsed.toLocaleString()}
          trend="up"
        />
        <StatCardEnhanced label="Platform calls handled" value={metrics.platformCallsHandled} />
        <StatCardEnhanced label="Platform bookings created" value={metrics.platformBookingsCreated} />
        <StatCardEnhanced
          label="Platform conversion rate"
          value={`${metrics.platformConversionRate.toFixed(1)}%`}
        />
        <StatCardEnhanced
          label="Escalation rate"
          value={`${metrics.escalationRate.toFixed(1)}%`}
          trend={metrics.escalationRate > 10 ? 'down' : 'neutral'}
        />
      </div>
    </section>
  );
}
