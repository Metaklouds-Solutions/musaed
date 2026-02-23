/**
 * Dashboard page: layout only. Data from useDashboard hook.
 */

import { PageHeader, EmptyState } from '../../../shared/ui';
import { HeroMetrics } from '../components/HeroMetrics';
import { ConversionFunnel } from '../components/ConversionFunnel';
import { AgentIntelligence } from '../components/AgentIntelligence';
import { TrendChart } from '../components/TrendChart';
import { useDashboard } from '../hooks';
import { LayoutDashboard } from 'lucide-react';

export function DashboardPage() {
  const { user, metrics, funnel, trend } = useDashboard();

  if (!user) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="Sign in to view dashboard"
        description="Select a role on the login page to see metrics."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Revenue impact and conversion from your AI calls."
      />
      <div className="space-y-6">
        <HeroMetrics metrics={metrics} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversionFunnel stages={funnel} />
          <AgentIntelligence metrics={metrics} />
        </div>
        <TrendChart points={trend} />
      </div>
    </>
  );
}
