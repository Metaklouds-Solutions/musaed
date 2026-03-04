/**
 * Admin runs & logs page. Cross-tenant agent runs with cost view.
 * Modern pagination: 10 runs per page, clean UI.
 */

import { useMemo } from 'react';
import { PageHeader, PopoverSelect, Pagination } from '../../../shared/ui';
import { RunsTable } from '../components/RunsTable';
import { useAdminRuns } from '../hooks';

export function AdminRunsPage() {
  const {
    tenants,
    runs,
    paginatedRuns,
    totalCost,
    totalPages,
    page,
    setPage,
    tenantFilter,
    handleTenantChange,
  } = useAdminRuns();

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
