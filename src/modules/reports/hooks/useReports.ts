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

  return { outcomes, performance };
}
