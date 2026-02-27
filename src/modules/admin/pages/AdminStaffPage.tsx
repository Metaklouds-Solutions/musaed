/**
 * Admin staff page. Cross-tenant table, Add staff modal, CSV import.
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { UserPlus, Upload, Download } from 'lucide-react';
import { PageHeader, Button } from '../../../shared/ui';
import { StaffTable, AddStaffModal, StaffFilters } from '../../shared/staff';
import { staffAdapter, exportAdapter } from '../../../adapters';
import { useAdminStaff } from '../hooks';

export function AdminStaffPage() {
  const {
    staff,
    tenants,
    tenantFilter,
    setTenantFilter,
    roleFilter,
    setRoleFilter,
    refetch,
  } = useAdminStaff();

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
    alert('CSV import coming soon. Use Add Staff for now.');
  }, []);

  const handleExport = useCallback(() => {
    const rows = staff.map((s) => ({
      Name: s.name,
      Email: s.email,
      Role: s.roleLabel,
      Tenant: s.tenantName ?? s.tenantId,
      Status: s.status,
    }));
    exportAdapter.exportCsv(rows, `staff-admin-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Staff exported');
  }, [staff]);

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

      <AddStaffModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        tenantId={tenantFilter ?? tenants[0]?.id ?? ''}
        tenants={tenants}
        showTenantSelect
        onSubmit={handleAddStaff}
      />

      <StaffTable staff={staff} showTenant />
    </div>
  );
}
