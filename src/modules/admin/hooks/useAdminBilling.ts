import { useMemo, useState } from 'react';
import { adminAdapter } from '../../../adapters';

/** Admin billing hook for cross-tenant rows, filtering, and totals. */
export function useAdminBilling() {
  const allRows = useMemo(() => adminAdapter.getBillingOverview(), []);
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!tenantFilter) return allRows;
    return allRows.filter((r) => r.tenantId === tenantFilter);
  }, [allRows, tenantFilter]);

  const totals = useMemo(() => {
    const totalMrr = rows.reduce((s, r) => s + r.mrr, 0);
    const totalUsageCost = rows.reduce((s, r) => s + r.usageCostUsd, 0);
    return { totalMrr, totalUsageCost };
  }, [rows]);

  return { allRows, rows, totals, tenantFilter, setTenantFilter };
}
