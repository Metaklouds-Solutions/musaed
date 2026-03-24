/**
 * Dashboard page: layout only. Data from useDashboard hook.
 * Tenant-scoped KPIs, agent status, recent calls, conversion funnel, trends.
 */

import { useState, useMemo } from 'react';

const HEADER_ANIMATION = { duration: 0.3 };
import { motion } from 'motion/react';
import { PageHeader, EmptyState, SkeletonCard } from '../../../shared/ui';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { DateRangePicker } from '../../../components/DateRangePicker';
import { TenantKpiCards } from '../components/TenantKpiCards';
import { RecentCallsTable } from '../components/RecentCallsTable';
import { ConversionFunnel } from '../components/ConversionFunnel';
import { TrendChart } from '../components/TrendChart';
import { useDashboard } from '../hooks';
import { LayoutDashboard } from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const DEFAULT_RANGE = (() => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { start, end };
})();
const SKELETON_CARD_KEYS = ['metrics-1', 'metrics-2', 'metrics-3', 'metrics-4'] as const;

/** Tenant dashboard: KPIs, agent status, recent calls, conversion funnel, trends. */
export function DashboardPage() {
  const ready = useDelayedReady();
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const dateRangeFilter = useMemo(() => ({ start: dateRange.start, end: dateRange.end }), [dateRange]);
  const {
    user,
    metrics,
    funnel,
    trend,
    kpis,
    agentStatus,
    recentCalls,
  } = useDashboard(dateRangeFilter);

  if (!user) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="Sign in to view dashboard"
        description="Select a role on the login page to see metrics."
      />
    );
  }

  if (!ready) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Clinic command center." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SKELETON_CARD_KEYS.map((key) => (
            <SkeletonCard key={key} lines={2} />
          ))}
        </div>
        <SkeletonCard lines={3} />
      </div>
    );
  }

  const displayName = user.name ?? user.email ?? 'there';

  return (
    <>
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={HEADER_ANIMATION}
        className="mb-6 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6"
      >
        <PageHeader
          title="Dashboard"
          description="Clinic command center: calls, agent, and conversion."
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <p className="text-[var(--text-secondary)] text-sm">
              {getGreeting()}, {displayName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker value={dateRange} onChange={setDateRange} aria-label="Filter by date range" />
          </div>
        </div>
      </motion.header>
      <div className="space-y-6">
        <TenantKpiCards kpis={kpis} metrics={metrics} />
        <ConversionFunnel stages={funnel} />
        <RecentCallsTable calls={recentCalls} />
        <TrendChart points={trend} />
      </div>
    </>
  );
}
