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
