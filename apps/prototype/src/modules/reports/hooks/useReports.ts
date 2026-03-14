/**
 * Tenant reports. Outcomes and performance from adapter.
 */

import { useMemo } from 'react';
import { reportsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { DateRangeFilter } from '../../../adapters/local/reports.adapter';
import type { PerformanceMetrics } from '../../../shared/types/reports';

const defaultPerformance: PerformanceMetrics = {
  totalCalls: 0,
  totalBookings: 0,
  avgDurationSec: 0,
  conversionRate: 0,
  escalationRate: 0,
  sentimentAvg: 0,
};

export function useReports(tenantId: string | undefined, dateRange?: DateRangeFilter) {
  const { data: outcomes, loading: outcomesLoading } = useAsyncData(
    () => reportsAdapter.getOutcomes(tenantId, dateRange),
    [tenantId, dateRange],
    []
  );

  const { data: performance, loading: perfLoading } = useAsyncData(
    () => reportsAdapter.getPerformance(tenantId, dateRange),
    [tenantId, dateRange],
    defaultPerformance,
  );

  const { data: outcomesByVersion } = useAsyncData(
    () => reportsAdapter.getOutcomesByVersion(tenantId, dateRange),
    [tenantId, dateRange],
    []
  );

  const { data: periodComparison } = useAsyncData(async () => {
    if (!tenantId) return null;
    const thisWeek = await reportsAdapter.getPerformanceForPeriod(tenantId, 'thisWeek');
    const lastWeek = await reportsAdapter.getPerformanceForPeriod(tenantId, 'lastWeek');
    return {
      current: thisWeek,
      previous: lastWeek,
      label: 'vs last week',
    };
  }, [tenantId], null);

  const { data: sentimentDistribution } = useAsyncData(
    () => reportsAdapter.getSentimentDistribution(tenantId, dateRange),
    [tenantId, dateRange],
    []
  );

  const { data: peakHours } = useAsyncData(
    () => reportsAdapter.getPeakHours(tenantId, dateRange),
    [tenantId, dateRange],
    []
  );

  const { data: outcomesByDay } = useAsyncData(
    () => reportsAdapter.getOutcomesByDay(tenantId, dateRange),
    [tenantId, dateRange],
    []
  );

  const { data: intentDistribution } = useAsyncData(
    () => reportsAdapter.getIntentDistribution(tenantId, dateRange),
    [tenantId, dateRange],
    []
  );

  const loading = outcomesLoading || perfLoading;

  return {
    loading,
    outcomes,
    performance,
    outcomesByVersion,
    periodComparison,
    sentimentDistribution,
    peakHours,
    outcomesByDay,
    intentDistribution,
  };
}
