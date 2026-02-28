/**
 * Tenant reports. Outcomes and performance from adapter.
 */

import { useMemo } from 'react';
import { reportsAdapter } from '../../../adapters';
import type { DateRangeFilter } from '../../../adapters/local/reports.adapter';

export function useReports(tenantId: string | undefined, dateRange?: DateRangeFilter) {
  const outcomes = useMemo(
    () => reportsAdapter.getOutcomes(tenantId, dateRange),
    [tenantId, dateRange]
  );

  const performance = useMemo(
    () => reportsAdapter.getPerformance(tenantId, dateRange),
    [tenantId, dateRange]
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

  return {
    outcomes,
    performance,
    outcomesByVersion,
    periodComparison,
    sentimentDistribution,
    peakHours,
    outcomesByDay,
  };
}
