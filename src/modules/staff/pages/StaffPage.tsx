/**
 * Tenant staff page. Table + Add staff modal + CSV import.
 */

import { useState, useCallback } from 'react';
import { UserPlus, Upload } from 'lucide-react';
import { PageHeader, Button } from '../../../shared/ui';
import { StaffTable, AddStaffModal } from '../../shared/staff';
import { staffAdapter } from '../../../adapters/local/staff.adapter';
import { useStaff } from '../hooks';

export function StaffPage() {
  const { staff, tenantId, refetch } = useStaff();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const handleAddStaff = useCallback(
    (data: { name: string; email: string; roleSlug: string; tenantId: string }) => {
      staffAdapter.add({ ...data, tenantId: data.tenantId });
      refetch();
    },
    [refetch]
  );

  const handleImportCsv = useCallback(() => {
    alert('CSV import coming soon. Use Add Staff for now.');
  }, []);

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Staff" description="Staff list" />
        <p className="text-sm text-[var(--text-muted)]">Sign in as a tenant to view staff.</p>
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
