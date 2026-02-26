/**
 * Admin overview: platform revenue, usage, anomalies, churn risk.
 * Layout-only; data from useAdminOverview (adapter).
 */

import { motion } from 'motion/react';
import { PageHeader, LottiePlayer, LOTTIE_ASSETS } from '../../../shared/ui';
import { AdminQuickActions } from '../components/AdminQuickActions';
import { AdminRevenueSection } from '../components/AdminRevenueSection';
import { AdminPlatformSection } from '../components/AdminPlatformSection';
import { AdminAnomaliesSection } from '../components/AdminAnomaliesSection';
import { useAdminOverview } from '../hooks';

export function AdminOverviewPage() {
  const { metrics } = useAdminOverview();

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
          title="Admin overview"
          description="Platform revenue, usage, and risk metrics"
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 mt-4">
          <AdminQuickActions />
        </div>
      </motion.header>
      <AdminRevenueSection metrics={metrics} />
      <AdminPlatformSection metrics={metrics} />
      <AdminAnomaliesSection
        usageAnomalies={metrics.usageAnomalies}
        churnRiskList={metrics.churnRiskList}
      />
    </div>
  );
}
