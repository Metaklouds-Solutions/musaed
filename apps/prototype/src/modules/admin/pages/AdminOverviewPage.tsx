/**
 * Admin overview: platform KPIs, recent tenants, support snapshot, recent calls, system health.
 * Layout-only; data from useAdminOverview (adapter).
 */

import { motion } from 'motion/react';

const HEADER_ANIMATION = { duration: 0.3 };
import { PageHeader, LottiePlayer, LOTTIE_ASSETS } from '../../../shared/ui';
import { AdminQuickActions } from '../components/AdminQuickActions';
import { AdminKpiCards } from '../components/AdminKpiCards';
import { AdminRecentTenants } from '../components/AdminRecentTenants';
import { AdminSupportSnapshot } from '../components/AdminSupportSnapshot';
import { AdminRecentCalls } from '../components/AdminRecentCalls';
import { AdminSystemHealth } from '../components/AdminSystemHealth';
import { AdminRevenueSection } from '../components/AdminRevenueSection';
import { AdminPlatformSection } from '../components/AdminPlatformSection';
import { AdminAnomaliesSection } from '../components/AdminAnomaliesSection';
import { useAdminOverview } from '../hooks';
import { AlertTriangle, CheckCircle2, Radio } from 'lucide-react';

function getAdminSignal(args: {
  totalTenants: number;
  activeTenants: number;
  calls7d: number;
  recentCalls: number;
  recentTenants: number;
  openTickets: number;
}) {
  const { totalTenants, activeTenants, calls7d, recentCalls, recentTenants, openTickets } = args;
  const hasAnyPlatformSignal =
    totalTenants > 0 || calls7d > 0 || recentCalls > 0 || recentTenants > 0 || openTickets > 0;

  if (!hasAnyPlatformSignal) {
    return {
      tone: 'neutral',
      title: 'The platform has no visible operating signal yet',
      description:
        'No tenants, calls, or support activity are reaching the admin dashboard. This is expected only in an empty environment.',
    } as const;
  }

  if (activeTenants > 0 && calls7d === 0 && recentCalls === 0) {
    return {
      tone: 'warning',
      title: 'Active tenants exist but the call pipeline looks empty',
      description:
        'That usually means ingestion, sync, or dashboard aggregation is stale. Verify Retell/webhook flow and compare with raw call records.',
    } as const;
  }

  if (totalTenants > 0 && recentTenants === 0) {
    return {
      tone: 'warning',
      title: 'Tenant volume exists but recent onboarding is not visible',
      description:
        'The system is tracking tenants, but the recent-tenant feed returned no rows. Check tenant sorting, createdAt data, and admin list responses.',
    } as const;
  }

  return {
    tone: 'positive',
    title: 'Platform signal is healthy',
    description: `${activeTenants} active tenants and ${calls7d} calls were detected in the last 7 days. Use the sections below to watch conversion, support pressure, and infrastructure health.`,
  } as const;
}

/** Admin dashboard page. Platform KPIs, tenants, support, calls, system health. */
export function AdminOverviewPage() {
  const {
    metrics,
    kpis,
    recentTenants,
    supportSnapshot,
    recentCalls,
    systemHealth,
  } = useAdminOverview();
  const adminSignal = getAdminSignal({
    totalTenants: kpis.totalTenants,
    activeTenants: kpis.activeTenants,
    calls7d: kpis.calls7d,
    recentCalls: recentCalls.length,
    recentTenants: recentTenants.length,
    openTickets: supportSnapshot.openCount,
  });

  return (
    <div className="space-y-8">
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={HEADER_ANIMATION}
        className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[linear-gradient(135deg,var(--bg-elevated)_0%,var(--bg-subtle)_100%)] p-6 shadow-[var(--shadow-card)]"
      >
        <div className="absolute -top-8 -left-8 h-28 w-28 rounded-full bg-[var(--ds-primary)]/10 blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-28 h-28 opacity-15 pointer-events-none -translate-y-6 translate-x-6">
          <LottiePlayer src={LOTTIE_ASSETS.chart} width={112} height={112} loop />
        </div>
        <PageHeader
          title="Admin Dashboard"
          description="Platform KPIs, tenants, support, and system health"
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 mt-4">
          <AdminQuickActions />
        </div>
      </motion.header>

      <section
        className={`rounded-[var(--radius-card)] border p-4 shadow-[var(--shadow-card)] ${
          adminSignal.tone === 'warning'
            ? 'border-[var(--warning)]/40 bg-[color-mix(in_srgb,var(--warning)_8%,var(--bg-elevated))]'
            : adminSignal.tone === 'positive'
              ? 'border-emerald-500/30 bg-[color-mix(in_srgb,emerald_8%,var(--bg-elevated))]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/90'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 rounded-full p-2 ${
              adminSignal.tone === 'warning'
                ? 'bg-[var(--warning)]/15 text-[var(--warning)]'
                : adminSignal.tone === 'positive'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-[var(--ds-primary)]/15 text-[var(--ds-primary)]'
            }`}
          >
            {adminSignal.tone === 'warning' ? <AlertTriangle size={16} /> : adminSignal.tone === 'positive' ? <CheckCircle2 size={16} /> : <Radio size={16} />}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{adminSignal.title}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{adminSignal.description}</p>
          </div>
        </div>
      </section>

      <AdminKpiCards kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminRecentTenants tenants={recentTenants} />
        <AdminSupportSnapshot snapshot={supportSnapshot} />
      </div>

      <AdminRecentCalls calls={recentCalls} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminSystemHealth health={systemHealth} />
        <div className="lg:col-span-2">
          <AdminRevenueSection metrics={metrics} />
        </div>
      </div>

      <AdminPlatformSection metrics={metrics} />
      <AdminAnomaliesSection
        usageAnomalies={metrics.usageAnomalies}
        churnRiskList={metrics.churnRiskList}
      />
    </div>
  );
}
