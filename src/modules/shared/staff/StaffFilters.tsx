/**
 * Staff filters. Tenant dropdown for admin; role filter optional.
 */

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
  return (
    <div className="flex flex-wrap gap-3">
      {showTenantFilter && tenants.length > 0 && (
        <select
          value={selectedTenantId ?? ''}
          onChange={(e) => onTenantChange(e.target.value || null)}
          className="px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
        >
          <option value="">All tenants</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      )}
      {onRoleChange && (
        <select
          value={roleFilter ?? ''}
          onChange={(e) => onRoleChange(e.target.value || null)}
          className="px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
        >
          {ROLES.map((r) => (
            <option key={r.value || 'all'} value={r.value}>{r.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
