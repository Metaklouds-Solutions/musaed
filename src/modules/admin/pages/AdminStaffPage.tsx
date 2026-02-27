/**
 * Admin staff page. Cross-tenant table, Add staff modal, CSV import.
 */

import { useState, useCallback } from 'react';
import { UserPlus, Upload } from 'lucide-react';
import { PageHeader, Button } from '../../../shared/ui';
import { StaffTable, AddStaffModal, StaffFilters } from '../../shared/staff';
import { staffAdapter } from '../../../adapters/local/staff.adapter';
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
      staffAdapter.add({ ...data, tenantId: data.tenantId });
      refetch();
    },
    [refetch]
  );

  const handleImportCsv = useCallback(() => {
    alert('CSV import coming soon. Use Add Staff for now.');
  }, []);

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
