import { useMemo, useState, useCallback } from 'react';
import { runsAdapter, tenantsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';

const PAGE_SIZE = 10;

/** Admin runs hook with tenant filtering, pagination, and total cost aggregation. */
export function useAdminRuns() {
  const [tenantFilter, setTenantFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data: tenants } = useAsyncData(() => tenantsAdapter.getAllTenants(), [], []);
  const { data: runs } = useAsyncData(
    () => runsAdapter.listRuns(tenantFilter || undefined),
    [tenantFilter],
    [],
  );

  const totalCost = useMemo(
    () => runs.reduce((sum, r) => sum + r.cost, 0),
    [runs]
  );

  const totalPages = Math.max(1, Math.ceil(runs.length / PAGE_SIZE));
  const paginatedRuns = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return runs.slice(start, start + PAGE_SIZE);
  }, [runs, page]);

  const handleTenantChange = useCallback((value: string) => {
    setTenantFilter(value);
    setPage(1);
  }, []);

  return {
    tenants,
    runs,
    paginatedRuns,
    totalCost,
    totalPages,
    page,
    setPage,
    tenantFilter,
    handleTenantChange,
  };
}
