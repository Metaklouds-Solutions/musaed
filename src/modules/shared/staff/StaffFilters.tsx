/**
 * Staff filters. Tenant dropdown for admin; role filter optional.
 * Uses PopoverSelect for smooth dropdown UX.
 */

import { PopoverSelect } from '../../../shared/ui';
import type { AdminTenantRow } from '../../../shared/types';

interface StaffFiltersProps {
  tenants?: AdminTenantRow[];
  selectedTenantId: string | null;
  onTenantChange: (id: string | null) => void;
  roleFilter?: string | null;
  onRoleChange?: (role: string | null) => void;
  showTenantFilter?: boolean;
}

const ROLES = [
  { value: '', label: 'All roles' },
  { value: 'tenant_owner', label: 'Owner' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'receptionist', label: 'Receptionist' },
];

export function StaffFilters({
  tenants = [],
  selectedTenantId,
  onTenantChange,
  roleFilter,
  onRoleChange,
  showTenantFilter = false,
}: StaffFiltersProps) {
  const tenantOptions = [
    { value: '', label: 'All tenants' },
    ...tenants.map((t) => ({ value: t.id, label: t.name })),
  ];

  const roleOptions = ROLES.map((r) => ({ value: r.value, label: r.label }));

  return (
    <div className="flex flex-wrap gap-3">
      {showTenantFilter && tenants.length > 0 && (
        <PopoverSelect
          value={selectedTenantId ?? ''}
          onChange={(v) => onTenantChange(v || null)}
          options={tenantOptions}
          title="Tenant"
          aria-label="Filter by tenant"
        />
      )}
      {onRoleChange && (
        <PopoverSelect
          value={roleFilter ?? ''}
          onChange={(v) => onRoleChange(v || null)}
          options={roleOptions}
          title="Role"
          aria-label="Filter by role"
        />
      )}
    </div>
  );
}
