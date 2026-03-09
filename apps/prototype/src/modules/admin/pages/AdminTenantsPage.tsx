/**
 * Admin Tenants: Tenant list and Compare Tenants views. [PHASE-7-BULK-ACTIONS]
 * Uses TenantListRow with status, plan, search filters.
 */

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Users, GitCompare, Trash2 } from 'lucide-react';
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
  ConfirmDeleteBar,
  Pagination,
} from '../../../shared/ui';
import { DateRangePicker } from '../../../components/DateRangePicker';
import { useAdminTenantList } from '../hooks';
import { tenantsAdapter } from '../../../adapters';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { useTableSelection } from '../../../shared/hooks/useTableSelection';
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

function getViewTabId(mode: ViewMode): string {
  return `admin-tenants-tab-${mode}`;
}

function getViewPanelId(mode: ViewMode): string {
  return `admin-tenants-panel-${mode}`;
}

function statusVariant(status: string): PillTagVariant {
  if (status === 'ACTIVE') return 'status';
  if (status === 'TRIAL') return 'role';
  return 'outcomeFailed';
}

/** Renders admin tenants list/compare views with bulk actions and date filtering. */
export function AdminTenantsPage() {
  const ready = useDelayedReady();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const [planFilter, setPlanFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { tenants, loading: tenantsLoading, refetch: refetchTenants, plans, statuses } = useAdminTenantList(refreshKey, {
    plan: planFilter,
    status: statusFilter,
    search: searchQuery,
  });
  const navigate = useNavigate();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { items: displayTenants, addOptimistic } = useOptimisticList<TenantListRow>({
    items: tenants,
    getKey: (t) => t.id,
  });

  const totalPages = Math.max(1, Math.ceil(displayTenants.length / pageSize));
  const pagedTenants = displayTenants.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [planFilter, statusFilter, searchQuery]);
  const selection = useTableSelection((t: TenantListRow) => t.id);

  const handleAddSuccess = useCallback(
    (created: { id: string; name: string; plan: string }) => {
      addOptimistic({
        id: created.id,
        name: created.name,
        plan: created.plan,
        status: 'ONBOARDING',
        agentCount: 0,
        mrr: 0,
        callsThisMonth: 0,
        onboardingStatus: 'Step 1/4',
      });
      setRefreshKey((k) => k + 1);
      refetchTenants();
    },
    [addOptimistic, refetchTenants]
  );

  const handleDeleteClick = useCallback(
    (id: string, name: string) => () => setDeleteTarget({ id, name }),
    []
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const ids = deleteTarget.id.split(',');
      for (const id of ids) {
        await Promise.resolve(tenantsAdapter.deleteTenant(id));
      }
      toast.success(ids.length > 1 ? `${ids.length} tenants deleted` : `"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      selection.clear();
      setRefreshKey((k) => k + 1);
      refetchTenants();
    } catch {
      toast.error('Failed to delete tenant');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, refetchTenants, selection]);

  const handleDeleteCancel = useCallback(() => setDeleteTarget(null), []);

  const selectedTenants = displayTenants.filter((t) => selection.selectedSet.has(t.id));
  const handleView = useCallback(
    (id: string) => () => navigate(`/admin/tenants/${id}`),
    [navigate]
  );

  const handleBulkDelete = useCallback(() => {
    if (selectedTenants.length === 0) return;
    setDeleteTarget({
      id: selectedTenants.map((t) => t.id).join(','),
      name: `${selectedTenants.length} tenant(s)`,
    });
  }, [selectedTenants]);

  const checkboxClass =
    'w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--ds-primary)] focus:ring-2 focus:ring-[var(--ds-primary)] cursor-pointer';
  const allTenantsSelected = pagedTenants.length > 0 && pagedTenants.every((t) => selection.selectedSet.has(t.id));
  const someTenantsSelected = pagedTenants.some((t) => selection.selectedSet.has(t.id));
  const headerCheckRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = headerCheckRef.current;
    if (el) el.indeterminate = Boolean(someTenantsSelected && !allTenantsSelected);
  }, [someTenantsSelected, allTenantsSelected]);

  const handleViewTabsKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Home') return setViewMode('list');
      if (event.key === 'End') return setViewMode('compare');
      if (event.key === 'ArrowRight') return setViewMode(viewMode === 'list' ? 'compare' : 'list');
      if (event.key === 'ArrowLeft') return setViewMode(viewMode === 'compare' ? 'list' : 'compare');
    },
    [viewMode]
  );

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
          onKeyDown={handleViewTabsKeyDown}
          className="inline-flex flex-wrap w-full sm:w-auto gap-1.5 p-2 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm ring-1 ring-black/5"
        >
          <button
            id={getViewTabId('list')}
            role="tab"
            aria-selected={viewMode === 'list'}
            aria-controls={getViewPanelId('list')}
            tabIndex={viewMode === 'list' ? 0 : -1}
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
            id={getViewTabId('compare')}
            role="tab"
            aria-selected={viewMode === 'compare'}
            aria-controls={getViewPanelId('compare')}
            tabIndex={viewMode === 'compare' ? 0 : -1}
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
        {!ready || (tenantsLoading && displayTenants.length === 0) ? (
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
            id={getViewPanelId('list')}
            role="tabpanel"
            aria-labelledby={getViewTabId('list')}
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
                  <Button variant="secondary" size="sm" onClick={handleBulkDelete} className="shrink-0">
                    <Trash2 className="w-4 h-4" aria-hidden />
                    Delete
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
                              onChange={() => selection.toggleAll(pagedTenants)}
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
                        {pagedTenants.map((t) => (
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
                                  onClick={handleDeleteClick(t.id, t.name)}
                                  aria-label="Delete tenant"
                                  className="text-[var(--text-muted)] hover:text-[var(--destructive)]"
                                >
                                  <Trash2 size={16} aria-hidden />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </DataTable>
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={displayTenants.length}
                />
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="compare"
            id={getViewPanelId('compare')}
            role="tabpanel"
            aria-labelledby={getViewTabId('compare')}
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

      <ConfirmDeleteBar
        open={deleteTarget !== null}
        itemName={deleteTarget?.name ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleting}
      />
    </div>
  );
}
