/**
 * Tenant reports page. Outcomes and performance metrics.
 */

import { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { PageHeader, EmptyState } from '../../../shared/ui';
import { DateRangePicker } from '../../../components/DateRangePicker';
import { OutcomeBreakdown } from '../components/OutcomeBreakdown';
import { PerformanceMetrics } from '../components/PerformanceMetrics';
import { ABComparisonReport } from '../components/ABComparisonReport/ABComparisonReport';
import { PeriodComparison } from '../components/PeriodComparison/PeriodComparison';
import { SentimentChart } from '../components/SentimentChart/SentimentChart';
import { PeakHoursChart } from '../components/PeakHoursChart/PeakHoursChart';
import { OutcomesOverTimeChart } from '../components/OutcomesOverTimeChart/OutcomesOverTimeChart';
import { IntentAnalyticsChart } from '../components/IntentAnalyticsChart';
import { useReports } from '../hooks/useReports';
import { useSession } from '../../../app/session/SessionContext';

const DEFAULT_RANGE = (() => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { start, end };
})();

export function ReportsPage() {
  const { user } = useSession();
  const tenantId = user?.tenantId;
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const dateRangeFilter = useMemo(() => ({ start: dateRange.start, end: dateRange.end }), [dateRange]);
  const {
    outcomes,
    performance,
    outcomesByVersion,
    periodComparison,
    sentimentDistribution,
    peakHours,
    outcomesByDay,
    intentDistribution,
  } = useReports(tenantId, dateRangeFilter);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Reports"
          description="Call outcomes and agent performance"
        />
        <DateRangePicker value={dateRange} onChange={setDateRange} aria-label="Filter by date range" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OutcomeBreakdown outcomes={outcomes} />
        <PerformanceMetrics metrics={performance} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SentimentChart buckets={sentimentDistribution} />
        <PeakHoursChart points={peakHours} />
        <IntentAnalyticsChart buckets={intentDistribution} />
        <div className="lg:col-span-2">
          <OutcomesOverTimeChart data={outcomesByDay} />
        </div>
      </div>

      {periodComparison && (
        <PeriodComparison
          current={periodComparison.current}
          previous={periodComparison.previous}
          label={periodComparison.label}
        />
      )}

      {outcomesByVersion.length > 0 && (
        <div className="mt-6">
          <ABComparisonReport rows={outcomesByVersion} />
        </div>
      )}
    </div>
  );
}
