/**
 * Tenant staff page. Table + Add staff modal + CSV import.
 * Uses staffAdapter, exportAdapter only.
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { UserPlus, Upload, Download } from 'lucide-react';
import { PageHeader, Button, TableSkeleton } from '../../../shared/ui';
import { StaffTable, AddStaffModal } from '../../shared/staff';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { staffAdapter, exportAdapter } from '../../../adapters';
import { useStaff } from '../hooks';

/** Tenant staff list: Add modal, import/export. Data from useStaff hook. */
export function StaffPage() {
  const ready = useDelayedReady();
  const { staff, tenantId, refetch } = useStaff();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const handleAddStaff = useCallback(
    (data: { name: string; email: string; roleSlug: string; tenantId: string }) => {
      const added = staffAdapter.add({ ...data, tenantId: data.tenantId });
      refetch();
      if (added) toast.success('Staff added');
      else toast.error('Failed to add staff');
    },
    [refetch]
  );

  const handleImportCsv = useCallback(() => {
    toast.info('CSV import coming soon. Use Add Staff for now.');
  }, []);

  const handleExport = useCallback(() => {
    const rows = staff.map((s) => ({
      Name: s.name,
      Email: s.email,
      Role: s.roleLabel,
      Status: s.status,
    }));
    exportAdapter.exportCsv(rows, `staff-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Staff exported');
  }, [staff]);

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Staff" description="Staff list" />
        <p className="text-sm text-[var(--text-muted)]">Sign in as a tenant to view staff.</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader title="Staff" description="Clinic staff list" />
        </div>
        <TableSkeleton rows={6} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Staff"
          description="Clinic staff list"
        />
        <div className="flex gap-2">
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
      </div>

      <AddStaffModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        tenantId={tenantId}
        onSubmit={handleAddStaff}
      />

      <StaffTable staff={staff} />
    </div>
  );
}
