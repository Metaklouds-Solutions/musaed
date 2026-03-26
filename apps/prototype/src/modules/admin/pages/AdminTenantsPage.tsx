/**
 * Admin Tenants: Tenant list with bulk actions. [PHASE-7-BULK-ACTIONS]
 * Uses TenantListRow with status, plan, search filters.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Users, MoreHorizontal, Power, PowerOff } from 'lucide-react';
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
  UnifiedFilterBar,
  BulkActionsBar,
  ConfirmDeleteBar,
  Pagination,
} from '../../../shared/ui';
import { useAdminTenantList } from '../hooks';
import { tenantsAdapter } from '../../../adapters';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { useTableSelection } from '../../../shared/hooks/useTableSelection';
import { useOptimisticList } from '../../../shared/hooks/useOptimisticList';
import type { TenantListRow } from '../../../shared/types';
import type { PillTagVariant } from '../../../shared/ui';
import { cn } from '@/lib/utils';
import { AddTenantModal } from '../components/AddTenantModal';
import { TenantActionsModal } from '../components/TenantActionsModal';
import { useSavedFilters } from '../../../shared/hooks/useSavedFilters';
import { useUrlQueryState } from '../../../shared/hooks/useUrlQueryState';

function statusVariant(status: string): PillTagVariant {
  if (status === 'ACTIVE') return 'status';
  if (status === 'TRIAL') return 'role';
  if (status === 'ONBOARDING') return 'outcomeFailed';
  return 'outcomeFailed';
}

/** Renders admin tenants list with bulk actions and filters. */
export function AdminTenantsPage() {
  const ready = useDelayedReady();
  const [refreshKey, setRefreshKey] = useState(0);
  const { state, patchState, resetState } = useUrlQueryState({
    plan: '',
    status: '',
    q: '',
  });
  const planFilter = state.plan || null;
  const statusFilter = state.status || null;
  const searchQuery = state.q;
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
  const { saved, saveCurrent, apply, deleteFilter } = useSavedFilters({
    pageKey: 'admin-tenants',
    currentFilters: { plan: state.plan, status: state.status, q: state.q },
    onApply: (filters) =>
      patchState({
        plan: typeof filters.plan === 'string' ? filters.plan : '',
        status: typeof filters.status === 'string' ? filters.status : '',
        q: typeof filters.q === 'string' ? filters.q : '',
      }),
  });

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
  const clearSelection = selection.clear;

  const handleAddSuccess = useCallback(
    (created: { id: string; name: string; plan: string }) => {
      patchState({ q: '', plan: '', status: '' });
      setPage(1);
      clearSelection();
      addOptimistic({
        id: created.id,
        name: created.name,
        plan: created.plan,
        status: 'ONBOARDING',
        agentCount: 0,
        mrr: 0,
        callsThisMonth: 0,
        onboardingStatus: 'Step 1/4',
        createdAt: new Date().toISOString(),
      });
      setRefreshKey((k) => k + 1);
    },
    [addOptimistic, clearSelection, patchState]
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

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-card)] card-glass border border-[var(--border-subtle)]/50 overflow-hidden flex flex-col">
        <div className="p-5 sm:p-6 border-b border-[var(--border-subtle)]/40">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <PageHeader
              title="Tenants"
              description="Platform tenant list"
              className="mb-0"
            />
            <Button onClick={() => setAddModalOpen(true)} className="rounded-xl px-5 shrink-0">
              <UserPlus className="w-4 h-4" aria-hidden />
              Add Tenant
            </Button>
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
        ) : (
            <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            {displayTenants.length === 0 && !searchQuery && !planFilter && !statusFilter ? (
              <div className="flex flex-col items-center justify-center py-20 sm:py-24 px-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]/50 flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-[var(--text-muted)]" />
                </div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">No tenants yet</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md leading-relaxed">
                  Get started by adding your first tenant. You can assign agents and monitor their performance.
                </p>
                <Button onClick={() => setAddModalOpen(true)} className="mt-8 rounded-xl px-6 py-2.5">
                  <UserPlus className="w-4 h-4" aria-hidden />
                  Add Tenant
                </Button>
              </div>
            ) : (
              <>
                <div className="p-5 sm:p-6 border-b border-[var(--border-subtle)]/40 space-y-5">
                  <UnifiedFilterBar
                    query={searchQuery}
                    onQueryChange={(q) => patchState({ q })}
                    searchPlaceholder="Search tenants..."
                    fields={[
                      {
                        id: 'plan',
                        label: 'Plan',
                        value: planFilter ?? '',
                        options: [
                          { value: '', label: 'All plans' },
                          ...plans.map((plan) => ({ value: plan.value, label: plan.label })),
                        ],
                      },
                      {
                        id: 'status',
                        label: 'Status',
                        value: statusFilter ?? '',
                        options: [
                          { value: '', label: 'All statuses' },
                          ...statuses.map((status) => ({ value: status.value, label: status.label })),
                        ],
                      },
                    ]}
                    onFieldChange={(fieldId, value) => {
                      if (fieldId === 'plan') patchState({ plan: value });
                      if (fieldId === 'status') patchState({ status: value });
                    }}
                    savedFilters={saved}
                    onSaveFilter={saveCurrent}
                    onApplyFilter={apply}
                    onDeleteFilter={deleteFilter}
                    activeFilterCount={[planFilter, statusFilter].filter(Boolean).length}
                    onReset={() => resetState()}
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
                    <div className="py-16 text-center text-sm text-[var(--text-secondary)]">
                      No tenants match your search or filters.
                    </div>
                  ) : (
                    <DataTable minWidth="min-w-[900px]" className="!bg-transparent !border-0 !shadow-none !rounded-none">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-0 hover:bg-transparent">
                            <TableHead className="w-14 py-4 font-semibold text-[var(--text-secondary)]">
                              <input
                                ref={headerCheckRef}
                                type="checkbox"
                                checked={allTenantsSelected}
                                onChange={() => selection.toggleAll(pagedTenants)}
                                className={cn(checkboxClass, 'p-1')}
                                aria-label="Select all"
                              />
                            </TableHead>
                            <TableHead className="py-4 font-semibold text-[var(--text-secondary)]">Name</TableHead>
                            <TableHead className="py-4 font-semibold text-[var(--text-secondary)]">Plan</TableHead>
                            <TableHead className="py-4 font-semibold text-[var(--text-secondary)]">Status</TableHead>
                            <TableHead className="py-4 text-right font-semibold text-[var(--text-secondary)]">Agents</TableHead>
                            <TableHead className="py-4 text-right font-semibold text-[var(--text-secondary)]">MRR</TableHead>
                            <TableHead className="py-4 text-right font-semibold text-[var(--text-secondary)]">Calls</TableHead>
                            <TableHead className="py-4 font-semibold text-[var(--text-secondary)]">Onboarding</TableHead>
                            <TableHead className="w-[120px] py-4 font-semibold text-[var(--text-secondary)]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-[var(--border-subtle)]/40">
                          {pagedTenants.map((t, i) => {
                            const isSelected = selection.selectedSet.has(t.id);
                            return (
                              <TableRow
                                key={t.id}
                                className={cn(
                                  'border-0 transition-colors',
                                  isSelected
                                    ? 'bg-[var(--ds-primary)]/5 hover:bg-[var(--ds-primary)]/8'
                                    : i % 2 === 0
                                      ? 'bg-transparent hover:bg-[var(--bg-subtle)]/50'
                                      : 'bg-[var(--bg-subtle)]/30 hover:bg-[var(--bg-subtle)]/50'
                                )}
                              >
                                <TableCell className="w-14 py-5 pl-4 sm:pl-6">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => selection.toggle(t.id)}
                                    className={cn(checkboxClass, 'p-1')}
                                    aria-label={`Select ${t.name}`}
                                  />
                                </TableCell>
                                <TableCell className="font-medium text-[var(--text-primary)] py-5">
                                  {t.name}
                                </TableCell>
                                <TableCell className="py-5">
                                  <PillTag variant="plan">{t.plan}</PillTag>
                                </TableCell>
                                <TableCell className="py-5">
                                  <PillTag variant={statusVariant(t.status)}>{t.status}</PillTag>
                                </TableCell>
                                <TableCell className="py-5 text-right text-[var(--text-secondary)] tabular-nums">
                                  {t.agentCount}
                                </TableCell>
                                <TableCell className="py-5 text-right text-[var(--text-secondary)] tabular-nums">
                                  ${t.mrr}
                                </TableCell>
                                <TableCell className="py-5 text-right text-[var(--text-secondary)] tabular-nums">
                                  {t.callsThisMonth}
                                </TableCell>
                                <TableCell className="py-5 text-sm text-[var(--text-secondary)]">
                                  {t.onboardingStatus}
                                </TableCell>
                                <TableCell className="py-5">
                                  <div className="flex items-center gap-2">
                                    <ViewButton
                                      onClick={handleView(t.id)}
                                      aria-label="View tenant"
                                      className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleActionsClick(t)}
                                      aria-label="Tenant actions"
                                      className="min-w-[44px] min-h-[44px] p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    >
                                      <MoreHorizontal size={18} aria-hidden />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </DataTable>
                  )}
                </div>
                {displayTenants.length > 0 && (
                  <div className="p-5 sm:p-6 border-t border-[var(--border-subtle)]/40">
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
