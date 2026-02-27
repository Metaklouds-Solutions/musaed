/**
 * Admin runs & logs page. Cross-tenant agent runs with cost view.
 */

import { useState, useMemo } from 'react';
import { PageHeader, PopoverSelect } from '../../../shared/ui';
import { RunsTable } from '../components/RunsTable';
import { runsAdapter } from '../../../adapters';
import { tenantsAdapter } from '../../../adapters';

export function AdminRunsPage() {
  const [tenantFilter, setTenantFilter] = useState<string>('');

  const tenants = tenantsAdapter.getAllTenants();
  const runs = useMemo(
    () => runsAdapter.listRuns(tenantFilter || undefined),
    [tenantFilter]
  );

  const totalCost = useMemo(
    () => runs.reduce((sum, r) => sum + r.cost, 0),
    [runs]
  );

  const tenantOptions = [
    { value: '', label: 'All tenants' },
    ...tenants.map((t) => ({ value: t.id, label: t.name })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Runs & Logs"
        description="Agent execution runs and cost view across tenants."
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PopoverSelect
            value={tenantFilter}
            onChange={setTenantFilter}
            options={tenantOptions}
            placeholder="All tenants"
            title="Tenant"
            aria-label="Filter by tenant"
          />
          <span className="text-sm text-[var(--text-muted)]">
            Total cost: <span className="font-semibold text-[var(--text-primary)]">${totalCost.toFixed(2)}</span>
          </span>
        </div>
      </div>
      <RunsTable runs={runs} />
    </div>
  );
}
