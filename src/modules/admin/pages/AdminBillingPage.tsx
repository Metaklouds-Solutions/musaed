/**
 * Admin billing page. Cross-tenant plans, usage, and cost view.
 */

import { useMemo, useState } from 'react';
import { PageHeader, TableFilters, Button } from '../../../shared/ui';
import { BillingTenantPlans } from '../components/BillingTenantPlans';
import { adminAdapter } from '../../../adapters';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

export function AdminBillingPage() {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Cross-tenant plans, usage, and cost overview."
      />
      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-xl bg-(--bg-elevated) border border-(--border-subtle) px-4 py-3">
          <span className="text-sm text-(--text-muted)">Total MRR</span>
          <p className="text-xl font-semibold text-(--text-primary) tabular-nums">
            {formatCurrency(totals.totalMrr)}
          </p>
        </div>
        <div className="rounded-xl bg-(--bg-elevated) border border-(--border-subtle) px-4 py-3">
          <span className="text-sm text-(--text-muted)">Total Usage Cost</span>
          <p className="text-xl font-semibold text-(--text-primary) tabular-nums">
            {formatCurrency(totals.totalUsageCost)}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <TableFilters
          showTenantFilter
          tenants={Array.from(new Map(allRows.map((r) => [r.tenantId, { value: r.tenantId, label: r.tenantName }])).values())}
          selectedTenantId={tenantFilter}
          onTenantChange={setTenantFilter}
        />
        <Button variant="secondary" className="shrink-0 min-h-[44px] touch-manipulation">
          Export
        </Button>
      </div>
      <BillingTenantPlans rows={rows} />
    </div>
  );
}
