/**
 * Tenant reports page focused on call outcomes and performance.
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3 } from 'lucide-react';
import { PageHeader, EmptyState } from '../../../shared/ui';
import { ReportsSkeleton } from '../components/ReportsSkeleton';
import { DateRangePicker } from '../../../components/DateRangePicker';
import type { DatePresetKey } from '../../../components/DateRangePicker';
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
  start.setDate(start.getDate() - 27);
  return { start, end };
})();

const REPORT_PRESETS: DatePresetKey[] = ['today', '7d', '4w', '3m', 'wtd', 'mtd', 'ytd', 'all', 'custom'];

/** Renders tenant reports page with call outcomes insights. */
export function ReportsPage() {
  const { user } = useSession();
  const tenantId = user?.tenantId;

  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const dateRangeFilter = useMemo(() => ({ start: dateRange.start, end: dateRange.end }), [dateRange]);
  const {
    loading: reportsLoading,
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
        <PageHeader title="Analytics" description="Call outcomes and performance insights" />
        <div className="rounded-[var(--radius-card)] card-accent p-8">
          <EmptyState
            icon={BarChart3}
            title="Sign in to view analytics"
            description="Select a tenant role on the login page to view your analytics."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <PageHeader
            title="Analytics"
            description="Call outcomes and performance insights"
          />
          <div className="flex items-center gap-2">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              mode="apply"
              presets={REPORT_PRESETS}
              aria-label="Filter by date range"
            />
            <button
              type="button"
              onClick={() => setDateRange(DEFAULT_RANGE)}
              className="px-2 py-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        {reportsLoading ? (
          <ReportsSkeleton />
        ) : (
          <>
            <PerformanceMetrics metrics={performance} />
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <div className="min-w-0 min-h-[240px] overflow-hidden rounded-xl [&>div]:h-full [&>div]:min-h-[240px] [&>div]:rounded-xl">
                <OutcomeBreakdown outcomes={outcomes} />
              </div>
              <div className="min-w-0 min-h-[240px] overflow-hidden rounded-xl [&>div]:h-full [&>div]:min-h-[240px] [&>div]:rounded-xl">
                <SentimentChart buckets={sentimentDistribution} />
              </div>
              <div className="min-w-0 min-h-[240px] overflow-hidden rounded-xl [&>div]:h-full [&>div]:min-h-[240px] [&>div]:rounded-xl">
                <PeakHoursChart points={peakHours} />
              </div>
              <div className="min-w-0 min-h-[240px] overflow-hidden rounded-xl [&>div]:h-full [&>div]:min-h-[240px] [&>div]:rounded-xl">
                <IntentAnalyticsChart buckets={intentDistribution} />
              </div>
            </div>

            <div className="mt-6">
              <OutcomesOverTimeChart data={outcomesByDay} />
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
          </>
        )}
      </motion.div>
    </div>
  );
}
