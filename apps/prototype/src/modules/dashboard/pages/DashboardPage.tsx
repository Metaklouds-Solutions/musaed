/**
 * Dashboard page: layout only. Data from useDashboard hook.
 * Tenant-scoped KPIs, agent status, recent calls, staff, support tickets.
 */

import { useState, useMemo } from 'react';

const HEADER_ANIMATION = { duration: 0.3 };
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
import { AlertTriangle, CheckCircle2, LayoutDashboard, Radio } from 'lucide-react';

function getTenantSignal(args: {
  calls7d: number;
  bookings: number;
  recentCalls: number;
  openTickets: number;
  callsHandled: number;
  hasAgent: boolean;
}) {
  const { calls7d, bookings, recentCalls, openTickets, callsHandled, hasAgent } = args;
  const hasOperationalData =
    calls7d > 0 || bookings > 0 || recentCalls > 0 || openTickets > 0 || callsHandled > 0;

  if (!hasOperationalData) {
    return {
      tone: 'neutral',
      title: 'No operational activity in the selected range',
      description:
        'The dashboard is live, but this date range has no calls, bookings, or tickets yet. Expand the range or verify fresh activity is being created.',
    } as const;
  }

  if (bookings > 0 && calls7d === 0) {
    return {
      tone: 'warning',
      title: 'Bookings exist but recent call volume is zero',
      description:
        'This usually means bookings were created outside voice flows, or the selected date range does not include the calls that drove them.',
    } as const;
  }

  if (calls7d > 0 && recentCalls === 0) {
    return {
      tone: 'warning',
      title: 'Aggregate call counts exist but the recent call list is empty',
      description:
        'Counts are loading from analytics, but call rows are missing from the recent-call feed. That is a data quality warning worth checking.',
    } as const;
  }

  if (!hasAgent && calls7d > 0) {
    return {
      tone: 'warning',
      title: 'Activity exists but no active agent is shown',
      description:
        'Calls are being counted, but the dashboard could not resolve a current agent assignment. Review agent deployment and sync state.',
    } as const;
  }

  return {
    tone: 'positive',
    title: 'Operational signal is healthy',
    description: `${calls7d} calls and ${bookings} bookings were recorded in this range. Use the call list and funnel below to identify where conversions or escalations are moving.`,
  } as const;
}

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

/** Tenant dashboard: KPIs, agent status, recent calls, staff, support, ROI. */
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
  const tenantSignal = getTenantSignal({
    calls7d: kpis.calls7d,
    bookings: kpis.appointmentsBooked,
    recentCalls: recentCalls.length,
    openTickets: openTickets.length,
    callsHandled: metrics.callsHandled,
    hasAgent: Boolean(agentStatus),
  });

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
        transition={HEADER_ANIMATION}
        className="mb-6 relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[linear-gradient(135deg,var(--bg-elevated)_0%,var(--bg-subtle)_100%)] p-6 shadow-[var(--shadow-card)]"
      >
        <div className="absolute -top-8 -left-8 h-28 w-28 rounded-full bg-[var(--ds-primary)]/10 blur-2xl pointer-events-none" />
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
        <section
          className={`rounded-[var(--radius-card)] border p-4 shadow-[var(--shadow-card)] ${
            tenantSignal.tone === 'warning'
              ? 'border-[var(--warning)]/40 bg-[color-mix(in_srgb,var(--warning)_8%,var(--bg-elevated))]'
              : tenantSignal.tone === 'positive'
                ? 'border-emerald-500/30 bg-[color-mix(in_srgb,emerald_8%,var(--bg-elevated))]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/90'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 rounded-full p-2 ${
                tenantSignal.tone === 'warning'
                  ? 'bg-[var(--warning)]/15 text-[var(--warning)]'
                  : tenantSignal.tone === 'positive'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-[var(--ds-primary)]/15 text-[var(--ds-primary)]'
              }`}
            >
              {tenantSignal.tone === 'warning' ? <AlertTriangle size={16} /> : tenantSignal.tone === 'positive' ? <CheckCircle2 size={16} /> : <Radio size={16} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">{tenantSignal.title}</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{tenantSignal.description}</p>
            </div>
          </div>
        </section>
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
