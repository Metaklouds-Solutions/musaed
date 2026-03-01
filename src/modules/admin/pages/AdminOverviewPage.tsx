/**
 * Admin overview: platform KPIs, recent tenants, support snapshot, recent calls, system health.
 * Layout-only; data from useAdminOverview (adapter).
 */

import { motion } from 'motion/react';
import { PageHeader, LottiePlayer, LOTTIE_ASSETS } from '../../../shared/ui';
import { AdminQuickActions } from '../components/AdminQuickActions';
import { AdminKpiCards } from '../components/AdminKpiCards';
import { AdminRecentTenants } from '../components/AdminRecentTenants';
import { AdminSupportSnapshot } from '../components/AdminSupportSnapshot';
import { AdminRecentCalls } from '../components/AdminRecentCalls';
import { AdminSystemHealth } from '../components/AdminSystemHealth';
import { AdminRevenueSection } from '../components/AdminRevenueSection';
import { AdminPlatformSection } from '../components/AdminPlatformSection';
import { TenantComparisonView } from '../components/TenantComparisonView';
import { AdminAnomaliesSection } from '../components/AdminAnomaliesSection';
import { useAdminOverview } from '../hooks';

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
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden"
      >
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
      <TenantComparisonView />
      <AdminAnomaliesSection
        usageAnomalies={metrics.usageAnomalies}
        churnRiskList={metrics.churnRiskList}
      />
    </div>
  );
}
