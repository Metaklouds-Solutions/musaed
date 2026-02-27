/**
 * Tenant reports. Outcomes and performance from adapter.
 */

import { useMemo } from 'react';
import { reportsAdapter } from '../../../adapters';

export function useReports(tenantId: string | undefined) {
  const outcomes = useMemo(
    () => reportsAdapter.getOutcomes(tenantId),
    [tenantId]
  );

  const performance = useMemo(
    () => reportsAdapter.getPerformance(tenantId),
    [tenantId]
  );

  return { outcomes, performance };
}
