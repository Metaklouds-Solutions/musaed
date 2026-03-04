/**
 * Admin runs & logs page. Cross-tenant agent runs with cost view.
 * Modern pagination: 10 runs per page, clean UI.
 */

import { useState, useMemo, useCallback } from 'react';
import { PageHeader, PopoverSelect, Pagination } from '../../../shared/ui';
import { RunsTable } from '../components/RunsTable';
import { runsAdapter } from '../../../adapters';
import { tenantsAdapter } from '../../../adapters';

const PAGE_SIZE = 10;

export function AdminRunsPage() {
  const [tenantFilter, setTenantFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const tenants = tenantsAdapter.getAllTenants();
  const runs = useMemo(
    () => runsAdapter.listRuns(tenantFilter || undefined),
    [tenantFilter]
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
            onChange={handleTenantChange}
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
      <div className="rounded-xl overflow-x-auto border border-[var(--border-subtle)] shadow-sm bg-[var(--bg-base)]">
        <RunsTable runs={paginatedRuns} />
      </div>
      <div className="flex justify-center py-6">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={runs.length}
        />
      </div>
    </div>
  );
}
