/**
 * Admin overview: platform revenue, usage, anomalies, churn risk.
 * Layout-only; data from useAdminOverview (adapter).
 */

import { PageHeader } from '../../../shared/ui';
import { useAdminOverview } from '../hooks';
import { AdminRevenueSection } from '../components/AdminRevenueSection';
import { AdminPlatformSection } from '../components/AdminPlatformSection';
import { AdminAnomaliesSection } from '../components/AdminAnomaliesSection';

export function AdminOverviewPage() {
  const { metrics } = useAdminOverview();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin overview"
        description="Platform revenue, usage, and risk metrics"
      />
      <AdminRevenueSection metrics={metrics} />
      <AdminPlatformSection metrics={metrics} />
      <AdminAnomaliesSection
        usageAnomalies={metrics.usageAnomalies}
        churnRiskList={metrics.churnRiskList}
      />
    </div>
  );
}
