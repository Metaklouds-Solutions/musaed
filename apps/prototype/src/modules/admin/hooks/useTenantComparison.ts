import { useState, useMemo } from 'react';
import { tenantsAdapter, reportsAdapter } from '../../../adapters';
import type { TenantComparisonRow } from '../../../shared/types/reports';

const DEFAULT_RANGE = (() => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { start, end };
})();

/** Tenant comparison hook for selector options and computed comparison rows. */
export function useTenantComparison(
  controlledDateRange?: { start: Date; end: Date },
  onDateRangeChange?: (range: { start: Date; end: Date }) => void
) {
  const [internalDateRange, setInternalDateRange] = useState(DEFAULT_RANGE);
  const dateRange = controlledDateRange ?? internalDateRange;
  const setDateRange = onDateRangeChange ?? setInternalDateRange;
  const [tenantA, setTenantA] = useState<string>('');
  const [tenantB, setTenantB] = useState<string>('');

  const tenants = useMemo(() => tenantsAdapter.getAllTenants(), []);
  const tenantOptions = useMemo(
    () => tenants.map((t) => ({ value: t.id, label: t.name })),
    [tenants]
  );

  const dateRangeFilter = useMemo(
    () => ({ start: dateRange.start, end: dateRange.end }),
    [dateRange]
  );

  const rows: TenantComparisonRow[] = useMemo(() => {
    const ids: string[] = [];
    if (tenantA) ids.push(tenantA);
    if (tenantB && tenantB !== tenantA) ids.push(tenantB);
    return reportsAdapter.getTenantComparison(ids, dateRangeFilter);
  }, [tenantA, tenantB, dateRangeFilter]);

  return {
    tenantA,
    setTenantA,
    tenantB,
    setTenantB,
    dateRange,
    setDateRange,
    tenantOptions,
    rows,
  };
}
