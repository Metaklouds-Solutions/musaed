/**
 * Admin Tenants: Tenant list and Compare Tenants views. [PHASE-7-BULK-ACTIONS]
 * Uses TenantListRow with status, plan, search filters.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Users, GitCompare, Archive, Download } from 'lucide-react';
import {
  PageHeader,
  DataTable,
  TableSkeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  ViewButton,
  PillTag,
  TableFilters,
  BulkActionsBar,
} from '../../../shared/ui';
import { DateRangePicker } from '../../../components/DateRangePicker';
import { useAdminTenantList } from '../hooks';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { useTableSelection } from '../../../shared/hooks/useTableSelection';
import { softDeleteAdapter, exportAdapter } from '../../../adapters';
import { useOptimisticList } from '../../../shared/hooks/useOptimisticList';
import type { TenantListRow } from '../../../shared/types';
import type { PillTagVariant } from '../../../shared/ui';
import { AddTenantModal } from '../components/AddTenantModal';
import { TenantComparisonView } from '../components/TenantComparisonView';

type ViewMode = 'list' | 'compare';

const DEFAULT_RANGE = (() => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { start, end };
})();

function statusVariant(status: string): PillTagVariant {
  if (status === 'ACTIVE') return 'status';
  if (status === 'TRIAL') return 'role';
  return 'outcomeFailed';
}

export function AdminTenantsPage() {
  const ready = useDelayedReady();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const [planFilter, setPlanFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { tenants, plans, statuses } = useAdminTenantList(refreshKey, {
    plan: planFilter,
    status: statusFilter,
    search: searchQuery,
  });
  const navigate = useNavigate();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { items: displayTenants, removeOptimistic, rollbackRemove, commit } = useOptimisticList<TenantListRow>({
    items: tenants,
    getKey: (t) => t.id,
  });
  const selection = useTableSelection((t: TenantListRow) => t.id);

  const handleAddSuccess = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleArchive = useCallback(
    (id: string) => () => {
      if (!window.confirm('Archive this tenant? They will be hidden from the list.')) return;
      removeOptimistic(id);
      try {
        softDeleteAdapter.softDeleteTenant(id);
        setRefreshKey((k) => k + 1);
        commit();
        toast.success('Tenant archived');
      } catch {
        rollbackRemove(id);
        toast.error('Failed to archive');
      }
    },
    [removeOptimistic, rollbackRemove, commit]
  );

  const selectedTenants = displayTenants.filter((t) => selection.selectedSet.has(t.id));
  const handleView = useCallback(
    (id: string) => () => navigate(`/admin/tenants/${id}`),
    [navigate]
  );

  const handleBulkArchive = useCallback(() => {
    if (selectedTenants.length === 0) return;
    if (!window.confirm(`Archive ${selectedTenants.length} tenant(s)? They will be hidden from the list.`)) return;
    let failed = 0;
    for (const t of selectedTenants) {
      removeOptimistic(t.id);
      try {
        softDeleteAdapter.softDeleteTenant(t.id);
      } catch {
        rollbackRemove(t.id);
        failed++;
      }
    }
    selection.clear();
    setRefreshKey((k) => k + 1);
    commit();
    if (failed > 0) toast.error(`Failed to archive ${failed} tenant(s)`);
    else toast.success(`Archived ${selectedTenants.length} tenant(s)`);
  }, [selectedTenants, removeOptimistic, rollbackRemove, commit, selection]);

  const handleBulkExport = useCallback(() => {
    if (selectedTenants.length === 0) return;
    const rows = selectedTenants.map((t) => ({
      ID: t.id,
      Name: t.name,
      Plan: t.plan,
      Status: t.status,
      Agents: t.agentCount,
      MRR: t.mrr,
      Calls: t.callsThisMonth,
      Onboarding: t.onboardingStatus,
    }));
    exportAdapter.exportCsv(rows, `tenants-selected-${new Date().toISOString().slice(0, 10)}.csv`);
    selection.clear();
    toast.success(`Exported ${selectedTenants.length} tenant(s)`);
  }, [selectedTenants, selection]);

  const checkboxClass =
    'w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--ds-primary)] focus:ring-2 focus:ring-[var(--ds-primary)] cursor-pointer';
  const allTenantsSelected = displayTenants.length > 0 && displayTenants.every((t) => selection.selectedSet.has(t.id));
  const someTenantsSelected = displayTenants.some((t) => selection.selectedSet.has(t.id));
  const headerCheckRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = headerCheckRef.current;
    if (el) el.indeterminate = Boolean(someTenantsSelected && !allTenantsSelected);
  }, [someTenantsSelected, allTenantsSelected]);

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <PageHeader
            title="Tenants"
            description="Platform tenant list and performance comparison"
          />
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {viewMode === 'compare' && (
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                aria-label="Date range for comparison"
              />
            )}
            {viewMode === 'list' && (
              <Button onClick={() => setAddModalOpen(true)}>
                <UserPlus className="w-4 h-4" aria-hidden />
                Add Tenant
              </Button>
            )}
          </div>
        </div>

        {/* Tab switcher - unified with Settings */}
        <div
          role="tablist"
          aria-label="View mode"
          className="inline-flex flex-wrap w-full sm:w-auto gap-1.5 p-2 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm ring-1 ring-black/5"
        >
          <button
            role="tab"
            aria-selected={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-[var(--bg-base)] text-[var(--ds-primary)] shadow-md border border-[var(--border-subtle)] ring-1 ring-[var(--ds-primary)]/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/60'
            }`}
          >
            <Users size={16} aria-hidden className="shrink-0" />
            Tenants
          </button>
          <button
            role="tab"
            aria-selected={viewMode === 'compare'}
            onClick={() => setViewMode('compare')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              viewMode === 'compare'
                ? 'bg-[var(--bg-base)] text-[var(--ds-primary)] shadow-md border border-[var(--border-subtle)] ring-1 ring-[var(--ds-primary)]/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/60'
            }`}
          >
            <GitCompare size={16} aria-hidden className="shrink-0" />
            Compare Tenants
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!ready ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <TableSkeleton rows={6} cols={4} />
          </motion.div>
        ) : viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {displayTenants.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-8">No tenants.</p>
            ) : (
              <>
                <TableFilters
                  plans={plans}
                  selectedPlan={planFilter}
                  onPlanChange={setPlanFilter}
                  statuses={statuses}
                  selectedStatus={statusFilter}
                  onStatusChange={setStatusFilter}
                  search={searchQuery}
                  onSearchChange={setSearchQuery}
                  searchPlaceholder="Search tenants…"
                />
                <BulkActionsBar count={selection.selectedSet.size} onClear={selection.clear}>
                  <Button variant="secondary" size="sm" onClick={handleBulkExport} className="shrink-0">
                    <Download className="w-4 h-4" aria-hidden />
                    Export
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleBulkArchive} className="shrink-0">
                    <Archive className="w-4 h-4" aria-hidden />
                    Archive
                  </Button>
                </BulkActionsBar>
                <div className="rounded-xl overflow-x-auto overflow-y-visible border border-[var(--border-subtle)] shadow-sm">
                  <DataTable minWidth="min-w-[900px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input
                              ref={headerCheckRef}
                              type="checkbox"
                              checked={allTenantsSelected}
                              onChange={() => selection.toggleAll(displayTenants)}
                              className={checkboxClass}
                              aria-label="Select all"
                            />
                          </TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Agents</TableHead>
                          <TableHead className="text-right">MRR</TableHead>
                          <TableHead className="text-right">Calls</TableHead>
                          <TableHead>Onboarding</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayTenants.map((t) => (
                          <TableRow
                            key={t.id}
                            className="border-t border-[var(--border-subtle)]/50 first:border-t-0"
                          >
                            <TableCell className="w-12 py-4">
                              <input
                                type="checkbox"
                                checked={selection.selectedSet.has(t.id)}
                                onChange={() => selection.toggle(t.id)}
                                className={checkboxClass}
                                aria-label={`Select ${t.name}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-[var(--text-primary)] py-4">
                              {t.name}
                            </TableCell>
                            <TableCell className="py-4">
                              <PillTag variant="plan">{t.plan}</PillTag>
                            </TableCell>
                            <TableCell className="py-4">
                              <PillTag variant={statusVariant(t.status)}>{t.status}</PillTag>
                            </TableCell>
                            <TableCell className="py-4 text-right text-[var(--text-secondary)]">
                              {t.agentCount}
                            </TableCell>
                            <TableCell className="py-4 text-right text-[var(--text-secondary)]">
                              ${t.mrr}
                            </TableCell>
                            <TableCell className="py-4 text-right text-[var(--text-secondary)]">
                              {t.callsThisMonth}
                            </TableCell>
                            <TableCell className="py-4 text-sm text-[var(--text-secondary)]">
                              {t.onboardingStatus}
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <ViewButton onClick={handleView(t.id)} aria-label="View tenant" />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleArchive(t.id)}
                                  aria-label="Archive tenant"
                                  className="text-[var(--text-muted)] hover:text-[var(--destructive)]"
                                >
                                  <Archive size={16} aria-hidden />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </DataTable>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <TenantComparisonView
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AddTenantModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}
