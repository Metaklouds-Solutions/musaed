/**
 * Admin tenant list with TenantListRow and filters (status, plan, search).
 */

import { useMemo } from 'react';
import { tenantsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { TenantListRow } from '../../../shared/types';

export interface TenantListFilters {
  status?: string | null;
  plan?: string | null;
  search?: string;
}

/** Returns admin tenant list rows and filter option metadata for tenants table. */
export function useAdminTenantList(
  refreshKey: number,
  filters: TenantListFilters
): {
  tenants: TenantListRow[];
  loading: boolean;
  refetch: () => void;
  plans: { value: string; label: string }[];
  statuses: { value: string; label: string }[];
} {
  const { data: tenants, loading, refetch } = useAsyncData(
    () =>
      tenantsAdapter.getTenantListRows({
        status: filters.status ?? undefined,
        plan: filters.plan ?? undefined,
        search: filters.search ?? undefined,
      }),
    [refreshKey, filters.status, filters.plan, filters.search],
    [] as TenantListRow[],
  );

  const plans = useMemo(() => {
    const set = new Set(tenants.map((t) => t.plan));
    return Array.from(set).map((p) => ({ value: p.toLowerCase(), label: p }));
  }, [tenants]);

  const statuses = useMemo(
    () => [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'ONBOARDING', label: 'Onboarding' },
      { value: 'TRIAL', label: 'Trial' },
      { value: 'SUSPENDED', label: 'Suspended' },
    ],
    []
  );

  return { tenants, loading, refetch, plans, statuses };
}
