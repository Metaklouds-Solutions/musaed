/**
 * Admin Tenants: Tenant list and Compare Tenants views. [PHASE-7-BULK-ACTIONS]
 * Uses TenantListRow with status, plan, search filters.
 */

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Users, GitCompare, MoreHorizontal, Power, PowerOff } from 'lucide-react';
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
import { TenantActionsModal } from '../components/TenantActionsModal';
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
  const [actionsModalTenant, setActionsModalTenant] = useState<TenantListRow | null>(null);
  const [actionTarget, setActionTarget] = useState<{
    id: string;
    name: string;
    action: 'enable' | 'disable';
    ids: string[];
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { items: displayTenants, addOptimistic, patchOptimistic, rollbackPatch } = useOptimisticList<TenantListRow>({
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

  const handleActionsClick = useCallback((tenant: TenantListRow) => () => {
    setActionsModalTenant(tenant);
  }, []);

  const handleActionConfirm = useCallback(async () => {
    if (!actionTarget) return;
    const { ids, action } = actionTarget;
    for (const id of ids) {
      patchOptimistic(id, { status: action === 'enable' ? 'ACTIVE' : 'SUSPENDED' });
    }
    setProcessing(true);
    try {
      const fn = action === 'enable' ? tenantsAdapter.enableTenant : tenantsAdapter.disableTenant;
      for (const id of ids) {
        await Promise.resolve(fn(id));
      }
      toast.success(
        ids.length > 1
          ? `${ids.length} tenants ${action === 'enable' ? 'enabled' : 'disabled'}`
          : `"${actionTarget.name}" ${action === 'enable' ? 'enabled' : 'disabled'}`
      );
      setActionTarget(null);
      selection.clear();
      setRefreshKey((k) => k + 1);
      refetchTenants();
    } catch {
      toast.error(`Failed to ${action} tenant`);
      for (const id of ids) {
        rollbackPatch(id);
      }
    } finally {
      setProcessing(false);
    }
  }, [actionTarget, refetchTenants, selection, patchOptimistic, rollbackPatch]);

  const handleActionCancel = useCallback(() => setActionTarget(null), []);

  const selectedTenants = displayTenants.filter((t) => selection.selectedSet.has(t.id));
  const handleView = useCallback(
    (id: string) => () => navigate(`/admin/tenants/${id}`),
    [navigate]
  );

  const handleBulkDisable = useCallback(() => {
    if (selectedTenants.length === 0) return;
    const active = selectedTenants.filter((t) => t.status !== 'SUSPENDED');
    if (active.length === 0) return;
    setActionTarget({
      id: active.map((t) => t.id).join(','),
      name: `${active.length} tenant(s)`,
      action: 'disable',
      ids: active.map((t) => t.id),
    });
  }, [selectedTenants]);

  const handleBulkEnable = useCallback(() => {
    if (selectedTenants.length === 0) return;
    const suspended = selectedTenants.filter((t) => t.status === 'SUSPENDED');
    if (suspended.length === 0) return;
    setActionTarget({
      id: suspended.map((t) => t.id).join(','),
      name: `${suspended.length} tenant(s)`,
      action: 'enable',
      ids: suspended.map((t) => t.id),
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
      <div className="rounded-[var(--radius-card)] card-glass border border-[var(--border-subtle)] overflow-hidden flex flex-col">
        {/* Header with tabs */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)]/50 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <PageHeader
              title="Tenants"
              description="Platform tenant list and performance comparison"
              className="mb-0"
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
                <Button onClick={() => setAddModalOpen(true)} className="rounded-xl px-5">
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
            className="flex flex-col"
          >
            {displayTenants.length === 0 && !searchQuery && !planFilter && !statusFilter ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[var(--text-muted)]" />
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)]">No tenants yet</p>
                <p className="mt-1 text-sm text-[var(--text-muted)] max-w-sm">
                  Get started by adding your first tenant. You can assign agents and monitor their performance.
                </p>
                <Button onClick={() => setAddModalOpen(true)} className="mt-6 rounded-xl px-5">
                  <UserPlus className="w-4 h-4" aria-hidden />
                  Add Tenant
                </Button>
              </div>
            ) : (
              <>
                <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)]/50 space-y-4">
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
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleBulkDisable}
                      className="shrink-0"
                      disabled={!selectedTenants.some((t) => t.status !== 'SUSPENDED')}
                    >
                      <PowerOff className="w-4 h-4" aria-hidden />
                      Disable
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleBulkEnable}
                      className="shrink-0"
                      disabled={!selectedTenants.some((t) => t.status === 'SUSPENDED')}
                    >
                      <Power className="w-4 h-4" aria-hidden />
                      Enable
                    </Button>
                  </BulkActionsBar>
                </div>
                <div className="overflow-x-auto overscroll-contain scroll-smooth">
                  {displayTenants.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[var(--text-muted)]">
                      No tenants match your search or filters.
                    </div>
                  ) : (
                    <DataTable minWidth="min-w-[900px]" className="!bg-transparent !border-0 !shadow-none !rounded-none">
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
                                    onClick={handleActionsClick(t)}
                                    aria-label="Tenant actions"
                                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                  >
                                    <MoreHorizontal size={18} aria-hidden />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </DataTable>
                  )}
                </div>
                {displayTenants.length > 0 && (
                  <div className="p-4 sm:p-5 border-t border-[var(--border-subtle)]/50">
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      totalItems={displayTenants.length}
                    />
                  </div>
                )}
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
      </div>

      <AddTenantModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <TenantActionsModal
        open={actionsModalTenant !== null}
        onClose={() => setActionsModalTenant(null)}
        tenant={actionsModalTenant}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
          refetchTenants();
        }}
      />

      <ConfirmDeleteBar
        open={actionTarget !== null}
        itemName={actionTarget?.name ?? ''}
        title={actionTarget?.action === 'enable' ? 'Enable tenant' : 'Disable tenant'}
        bodyMessage={
          actionTarget?.action === 'enable'
            ? `${actionTarget.name} will be able to log in again.`
            : `${actionTarget?.name ?? 'This tenant'} will not be able to log in until you enable them again.`
        }
        confirmLabel={actionTarget?.action === 'enable' ? 'Enable' : 'Disable'}
        variant={actionTarget?.action === 'enable' ? 'primary' : 'danger'}
        onConfirm={handleActionConfirm}
        onCancel={handleActionCancel}
        loading={processing}
      />

    </div>
  );
}
