/**
 * Dashboard page: layout only. Data from useDashboard hook.
 * Tenant-scoped KPIs, agent status, recent calls, staff, support tickets.
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { PageHeader, EmptyState, LottiePlayer, LOTTIE_ASSETS, SkeletonCard } from '../../../shared/ui';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { DateRangePicker } from '../../../components/DateRangePicker';
import { TenantKpiCards } from '../components/TenantKpiCards';
import { AgentStatusCard } from '../components/AgentStatusCard';
import { RecentCallsTable } from '../components/RecentCallsTable';
import { StaffQuickView } from '../components/StaffQuickView';
import { OpenTicketsWidget } from '../components/OpenTicketsWidget';
import { HeroMetrics } from '../components/HeroMetrics';
import { ConversionFunnel } from '../components/ConversionFunnel';
import { AgentIntelligence } from '../components/AgentIntelligence';
import { TrendChart } from '../components/TrendChart';
import { RoiDashboardWidget } from '../components/RoiDashboardWidget';
import { QuickActions } from '../components/QuickActions';
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
    staffCounts,
    openTickets,
    recentCalls,
    roi,
  } = useDashboard(dateRangeFilter);

  if (!user) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="Sign in to view dashboard"
        description="Select a role on the login page to see metrics."
        lottieSrc={LOTTIE_ASSETS.empty}
      />
    );
  }

  if (!ready) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Clinic command center." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      </div>
    );
  }

  const displayName = user.name ?? user.email ?? 'there';

  return (
    <>
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none -translate-y-8 translate-x-8">
          <LottiePlayer src={LOTTIE_ASSETS.chart} width={128} height={128} loop />
        </div>
        <PageHeader
          title="Dashboard"
          description="Clinic command center: calls, agent, staff, and support."
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
          <p className="text-[var(--text-secondary)] text-sm">
            {getGreeting()}, {displayName}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker value={dateRange} onChange={setDateRange} aria-label="Filter by date range" />
            <QuickActions />
          </div>
        </div>
      </motion.header>
      <div className="space-y-6">
        <TenantKpiCards kpis={kpis} />
        <RoiDashboardWidget roi={roi} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AgentStatusCard agent={agentStatus} />
          <StaffQuickView counts={staffCounts} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentCallsTable calls={recentCalls} />
          <OpenTicketsWidget tickets={openTickets} />
        </div>
        <HeroMetrics metrics={metrics} trend={trend} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversionFunnel stages={funnel} />
          <AgentIntelligence metrics={metrics} />
        </div>
        <TrendChart points={trend} />
      </div>
    </>
  );
}
