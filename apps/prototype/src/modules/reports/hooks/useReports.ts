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
  const outcomes = useMemo(
    () => reportsAdapter.getOutcomes(tenantId, dateRange),
    [tenantId, dateRange]
  );

  const { data: performance } = useAsyncData(
    () => reportsAdapter.getPerformance(tenantId, dateRange),
    [tenantId, dateRange],
    defaultPerformance,
  );

  const outcomesByVersion = useMemo(
    () => reportsAdapter.getOutcomesByVersion(tenantId, dateRange),
    [tenantId, dateRange]
  );

  const periodComparison = useMemo(() => {
    if (!tenantId) return null;
    const thisWeek = reportsAdapter.getPerformanceForPeriod(tenantId, 'thisWeek');
    const lastWeek = reportsAdapter.getPerformanceForPeriod(tenantId, 'lastWeek');
    return {
      current: thisWeek,
      previous: lastWeek,
      label: 'vs last week',
    };
  }, [tenantId]);

  const sentimentDistribution = useMemo(
    () => reportsAdapter.getSentimentDistribution(tenantId, dateRange),
    [tenantId, dateRange]
  );

  const peakHours = useMemo(
    () => reportsAdapter.getPeakHours(tenantId, dateRange),
    [tenantId, dateRange]
  );

  const outcomesByDay = useMemo(
    () => reportsAdapter.getOutcomesByDay(tenantId, dateRange),
    [tenantId, dateRange]
  );

  const intentDistribution = useMemo(
    () => reportsAdapter.getIntentDistribution(tenantId, dateRange),
    [tenantId, dateRange]
  );

  return {
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
