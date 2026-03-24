/**
 * Admin billing page. Cross-tenant plans, usage, and cost view.
 */

import { PageHeader, TableFilters, Button } from '../../../shared/ui';
import { BillingTenantPlans } from '../components/BillingTenantPlans';
import { useAdminBilling } from '../hooks';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

/** Renders cross-tenant billing overview with totals and tenant-level plan rows. */
export function AdminBillingPage() {
  const { allRows, rows, totals, tenantFilter, setTenantFilter } = useAdminBilling();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Cross-tenant plans, usage, and cost overview."
      />
      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-xl metric-card px-4 py-3">
          <span className="text-sm text-(--text-muted)">Total MRR</span>
          <p className="text-xl font-semibold text-(--text-primary) tabular-nums">
            {formatCurrency(totals.totalMrr)}
          </p>
        </div>
        <div className="rounded-xl metric-card px-4 py-3">
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
