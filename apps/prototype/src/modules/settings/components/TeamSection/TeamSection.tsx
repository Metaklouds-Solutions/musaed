/**
 * Team management section for the Settings page.
 * Staff list with add/delete, import/export CSV, and pagination.
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { UserPlus, Upload, Download } from 'lucide-react';
import { Button, TableSkeleton, Pagination, ConfirmDeleteBar } from '../../../../shared/ui';
import { StaffTable, AddStaffModal } from '../../../shared/staff';
import { staffAdapter, exportAdapter } from '../../../../adapters';
import { useStaff } from '../../../staff/hooks';
import type { StaffRow } from '../../../../shared/types';

const PAGE_SIZE = 10;

/**
 * Renders the team/staff list inside Settings.
 * Includes add modal, delete confirmation, CSV import/export, and pagination.
 */
export function TeamSection() {
  const { staff, tenantId, refetch, loading } = useStaff();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(staff.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedStaff = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return staff.slice(start, start + PAGE_SIZE);
  }, [staff, safePage]);

  const handleAddStaff = useCallback(
    async (data: { name: string; email: string; roleSlug: string; tenantId: string }) => {
      try {
        const result = staffAdapter.add({ ...data, tenantId: data.tenantId });
        const added = result instanceof Promise ? await result : result;
        await refetch();
        if (added) {
          toast.success('Staff added');
          setAddModalOpen(false);
          setPage(1);
        } else {
          toast.error('Failed to add staff');
        }
      } catch {
        toast.error('Failed to add staff');
      }
    },
    [refetch],
  );

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    tenantId: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = useCallback((s: StaffRow) => {
    setDeleteTarget({ id: s.userId, name: s.name, tenantId: s.tenantId });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await Promise.resolve(staffAdapter.deleteStaff(deleteTarget.id, deleteTarget.tenantId));
      await refetch();
      toast.success(`${deleteTarget.name} removed`);
      setDeleteTarget(null);
      setPage(1);
    } catch {
      toast.error('Failed to remove staff');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, refetch]);

  const handleDeleteCancel = useCallback(() => setDeleteTarget(null), []);

  const handleImportCsv = useCallback(() => {
    toast.info('CSV import coming soon. Use Add Staff for now.');
  }, []);

  const handleExport = useCallback(async () => {
    const rows = staff.map((s) => ({
      Name: s.name,
      Email: s.email,
      Role: s.roleLabel,
      Status: s.status,
    }));
    await exportAdapter.exportStaffCsv(rows);
    toast.success('Staff exported');
  }, [staff]);

  if (!tenantId) {
    return (
      <p className="text-sm text-[var(--text-muted)]">Sign in as a tenant to view staff.</p>
    );
  }

  if (loading && staff.length === 0) {
    return <TableSkeleton rows={6} cols={4} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={handleImportCsv} className="shrink-0">
          <Upload className="w-4 h-4" aria-hidden />
          Import CSV
        </Button>
        <Button variant="secondary" onClick={handleExport} className="shrink-0">
          <Download className="w-4 h-4" aria-hidden />
          Export CSV
        </Button>
        <Button onClick={() => setAddModalOpen(true)} className="shrink-0">
          <UserPlus className="w-4 h-4" aria-hidden />
          Add Staff
        </Button>
      </div>

      <AddStaffModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        tenantId={tenantId}
        onSubmit={handleAddStaff}
      />

      <StaffTable staff={paginatedStaff} showArchiveAction onArchive={handleDeleteClick} />

      <Pagination
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={staff.length}
      />

      <ConfirmDeleteBar
        open={deleteTarget !== null}
        itemName={deleteTarget?.name ?? ''}
        title="Delete staff member"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleting}
      />
    </div>
  );
}
