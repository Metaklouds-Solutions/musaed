/**
 * Admin staff page. Cross-tenant table, Add staff modal. [PHASE-7-BULK-ACTIONS]
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { UserPlus, Upload, Download, Archive } from 'lucide-react';
import { PageHeader, Button, TableSkeleton, BulkActionsBar } from '../../../shared/ui';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { useTableSelection } from '../../../shared/hooks/useTableSelection';
import { StaffTable, AddStaffModal, StaffFilters } from '../../shared/staff';
import { useAdminStaff } from '../hooks';
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
    archiveStaff,
    exportStaffCsv,
    toExportRows,
  } = useAdminStaff();

  const ready = useDelayedReady();
  const { items: displayStaff, removeOptimistic, rollbackRemove, commit } = useOptimisticList<StaffRow>({
    items: staff,
    getKey: getStaffKey,
  });
  const selection = useTableSelection(getStaffKey);

  const [addModalOpen, setAddModalOpen] = useState(false);

  const handleAddStaff = useCallback(
    (data: { name: string; email: string; roleSlug: string; tenantId: string }) => {
      const added = addStaff(data);
      if (added) toast.success('Staff added');
      else toast.error('Failed to add staff');
    },
    [addStaff]
  );

  const handleImportCsv = useCallback(() => {
    toast.info('CSV import coming soon. Use Add Staff for now.');
  }, []);

  const handleArchive = useCallback(
    (s: { userId: string; tenantId: string }) => {
      if (!window.confirm('Archive this staff member? They will be hidden from the list.')) return;
      const key = `${s.userId}::${s.tenantId}`;
      removeOptimistic(key);
      try {
        archiveStaff(s.userId, s.tenantId);
        commit();
        toast.success('Staff archived');
      } catch {
        rollbackRemove(key);
        toast.error('Failed to archive');
      }
    },
    [archiveStaff, removeOptimistic, rollbackRemove, commit]
  );

  const selectedStaff = displayStaff.filter((s) => selection.selectedSet.has(getStaffKey(s)));
  const handleExport = useCallback(() => {
    const rows = toExportRows(staff);
    exportStaffCsv(rows, `staff-admin-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Staff exported');
  }, [staff, toExportRows, exportStaffCsv]);

  const handleBulkArchive = useCallback(() => {
    if (selectedStaff.length === 0) return;
    if (!window.confirm(`Archive ${selectedStaff.length} staff member(s)? They will be hidden from the list.`)) return;
    let failed = 0;
    for (const s of selectedStaff) {
      const key = getStaffKey(s);
      removeOptimistic(key);
      try {
        archiveStaff(s.userId, s.tenantId);
      } catch {
        rollbackRemove(key);
        failed++;
      }
    }
    selection.clear();
    commit();
    if (failed > 0) toast.error(`Failed to archive ${failed} staff member(s)`);
    else toast.success(`Archived ${selectedStaff.length} staff member(s)`);
  }, [selectedStaff, removeOptimistic, rollbackRemove, commit, archiveStaff, selection]);

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
        <Button variant="secondary" size="sm" onClick={handleBulkArchive} className="shrink-0">
          <Archive className="w-4 h-4" aria-hidden />
          Archive
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
        staff={displayStaff}
        showTenant
        showArchiveAction
        onArchive={handleArchive}
        selectable
        selectedKeys={selection.selectedSet}
        onToggle={selection.toggle}
        onToggleAll={() => selection.toggleAll(displayStaff)}
      />
    </div>
  );
}
