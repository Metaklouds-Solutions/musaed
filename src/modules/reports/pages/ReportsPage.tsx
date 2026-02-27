/**
 * Tenant reports page. Outcomes and performance metrics.
 */

import { BarChart3 } from 'lucide-react';
import { PageHeader, EmptyState } from '../../../shared/ui';
import { OutcomeBreakdown } from '../components/OutcomeBreakdown';
import { PerformanceMetrics } from '../components/PerformanceMetrics';
import { useReports } from '../hooks/useReports';
import { useSession } from '../../../app/session/SessionContext';

export function ReportsPage() {
  const { user } = useSession();
  const tenantId = user?.tenantId;
  const { outcomes, performance } = useReports(tenantId);

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          description="Outcomes and performance metrics"
        />
        <div className="rounded-[var(--radius-card)] card-glass p-8">
          <EmptyState
            icon={BarChart3}
            title="Sign in to view reports"
            description="Select a tenant role on the login page to view your reports."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Call outcomes and agent performance"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OutcomeBreakdown outcomes={outcomes} />
        <PerformanceMetrics metrics={performance} />
      </div>
    </div>
  );
}
