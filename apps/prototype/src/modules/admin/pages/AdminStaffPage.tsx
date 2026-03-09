/**
 * Admin staff page. Cross-tenant table, Add staff modal. [PHASE-7-BULK-ACTIONS]
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { UserPlus, Upload, Download, Trash2 } from 'lucide-react';
import { PageHeader, Button, TableSkeleton, BulkActionsBar, Pagination, ConfirmDeleteBar } from '../../../shared/ui';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { useTableSelection } from '../../../shared/hooks/useTableSelection';
import { StaffTable, AddStaffModal, StaffFilters } from '../../shared/staff';
import { useAdminStaff } from '../hooks';
import { staffAdapter } from '../../../adapters';
import { useOptimisticList } from '../../../shared/hooks/useOptimisticList';
import type { StaffRow } from '../../../shared/types';

const getStaffKey = (s: StaffRow) => `${s.userId}::${s.tenantId}`;

/** Renders admin staff management with filters, bulk archive, and CSV actions. */
export function AdminStaffPage() {
  const {
    staff,
    tenants,
    tenantFilter,
    setTenantFilter,
    roleFilter,
    setRoleFilter,
    refetch,
    addStaff,
    exportStaffCsv,
    toExportRows,
  } = useAdminStaff();

  const ready = useDelayedReady();
  const { items: displayStaff } = useOptimisticList<StaffRow>({
    items: staff,
    getKey: getStaffKey,
  });
  const selection = useTableSelection(getStaffKey);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.max(1, Math.ceil(displayStaff.length / pageSize));
  const pagedStaff = useMemo(
    () => displayStaff.slice((page - 1) * pageSize, page * pageSize),
    [displayStaff, page],
  );

  useEffect(() => { setPage(1); }, [tenantFilter, roleFilter]);

  const handleAddStaff = useCallback(
    async (data: { name: string; email: string; roleSlug: string; tenantId: string }) => {
      try {
        const added = await addStaff(data);
        if (added) {
          toast.success('Staff added');
          refetch();
        } else {
          toast.error('Failed to add staff');
        }
      } catch {
        toast.error('Failed to add staff');
      }
    },
    [addStaff, refetch]
  );

  const handleImportCsv = useCallback(() => {
    toast.info('CSV import coming soon. Use Add Staff for now.');
  }, []);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = useCallback(
    (s: StaffRow) => {
      setDeleteTarget({ id: s.userId, name: s.name });
    },
    [],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await staffAdapter.deleteStaff(deleteTarget.id);
      toast.success('Staff member deleted');
      setDeleteTarget(null);
      refetch();
    } catch {
      toast.error('Failed to delete staff member');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, refetch]);

  const handleDeleteCancel = useCallback(() => setDeleteTarget(null), []);

  const selectedStaff = displayStaff.filter((s) => selection.selectedSet.has(getStaffKey(s)));

  const handleBulkDelete = useCallback(() => {
    if (selectedStaff.length === 0) return;
    setDeleteTarget({
      id: '__bulk__',
      name: `${selectedStaff.length} staff member(s)`,
    });
  }, [selectedStaff]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedStaff.length === 0) return;
    setDeleting(true);
    let failed = 0;
    for (const s of selectedStaff) {
      try {
        await staffAdapter.deleteStaff(s.userId);
      } catch {
        failed++;
      }
    }
    selection.clear();
    setDeleteTarget(null);
    setDeleting(false);
    refetch();
    if (failed > 0) toast.error(`Failed to delete ${failed} staff member(s)`);
    else toast.success(`Deleted ${selectedStaff.length} staff member(s)`);
  }, [selectedStaff, selection, refetch]);

  const handleExport = useCallback(() => {
    const rows = toExportRows(staff);
    exportStaffCsv(rows, `staff-admin-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Staff exported');
  }, [staff, toExportRows, exportStaffCsv]);

  const handleBulkExport = useCallback(() => {
    if (selectedStaff.length === 0) return;
    const rows = toExportRows(selectedStaff);
    exportStaffCsv(rows, `staff-selected-${new Date().toISOString().slice(0, 10)}.csv`);
    selection.clear();
    toast.success(`Exported ${selectedStaff.length} staff member(s)`);
  }, [selectedStaff, selection, toExportRows, exportStaffCsv]);

  if (!ready) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader title="Staff" description="Cross-tenant staff list" />
        </div>
        <TableSkeleton rows={8} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Staff"
          description="Cross-tenant staff list"
        />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleImportCsv}
            className="shrink-0"
          >
            <Upload className="w-4 h-4" aria-hidden />
            Import CSV
          </Button>
          <Button variant="secondary" onClick={handleExport} className="shrink-0">
            <Download className="w-4 h-4" aria-hidden />
            Export CSV
          </Button>
          <Button
            onClick={() => setAddModalOpen(true)}
            className="shrink-0"
          >
            <UserPlus className="w-4 h-4" aria-hidden />
            Add Staff
          </Button>
        </div>
      </div>

      <StaffFilters
        tenants={tenants}
        selectedTenantId={tenantFilter}
        onTenantChange={setTenantFilter}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        showTenantFilter
      />

      <BulkActionsBar count={selection.selectedSet.size} onClear={selection.clear}>
        <Button variant="secondary" size="sm" onClick={handleBulkExport} className="shrink-0">
          <Download className="w-4 h-4" aria-hidden />
          Export
        </Button>
        <Button variant="secondary" size="sm" onClick={handleBulkDelete} className="shrink-0">
          <Trash2 className="w-4 h-4" aria-hidden />
          Delete
        </Button>
      </BulkActionsBar>

      <AddStaffModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        tenantId={tenantFilter ?? tenants[0]?.id ?? ''}
        tenants={tenants}
        showTenantSelect
        onSubmit={handleAddStaff}
      />

      <StaffTable
        staff={pagedStaff}
        showTenant
        showArchiveAction
        onArchive={handleDeleteClick}
        selectable
        selectedKeys={selection.selectedSet}
        onToggle={selection.toggle}
        onToggleAll={() => selection.toggleAll(pagedStaff)}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={displayStaff.length}
      />

      <ConfirmDeleteBar
        open={deleteTarget !== null}
        itemName={deleteTarget?.name ?? ''}
        onConfirm={deleteTarget?.id === '__bulk__' ? handleBulkDeleteConfirm : handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleting}
      />
    </div>
  );
}
