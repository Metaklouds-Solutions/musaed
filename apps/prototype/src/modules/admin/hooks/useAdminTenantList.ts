/**
 * Admin tenant list with TenantListRow and filters (status, plan, search).
 */

import { useMemo } from 'react';
import { tenantsAdapter } from '../../../adapters';
import type { TenantListRow } from '../../../shared/types';

export interface TenantListFilters {
  status?: string | null;
  plan?: string | null;
  search?: string;
}

export function useAdminTenantList(
  refreshKey: number,
  filters: TenantListFilters
): { tenants: TenantListRow[]; plans: { value: string; label: string }[]; statuses: { value: string; label: string }[] } {
  const tenants = useMemo(() => {
    return tenantsAdapter.getTenantListRows({
      status: filters.status ?? undefined,
      plan: filters.plan ?? undefined,
      search: filters.search ?? undefined,
    });
  }, [refreshKey, filters.status, filters.plan, filters.search]);

  const plans = useMemo(() => {
    const all = tenantsAdapter.getTenantListRows({});
    const set = new Set(all.map((t) => t.plan));
    return Array.from(set).map((p) => ({ value: p.toLowerCase(), label: p }));
  }, []);

  const statuses = useMemo(
    () => [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'TRIAL', label: 'Trial' },
      { value: 'SUSPENDED', label: 'Suspended' },
    ],
    []
  );

  return useMemo(() => ({ tenants, plans, statuses }), [tenants, plans, statuses]);
}
