/**
 * Add Staff modal. Centered, like Add Tenant.
 */

import { useState, useCallback, useEffect } from 'react';
import { Modal, ModalHeader, PopoverSelect } from '../../../shared/ui';
import { AddStaffForm } from './AddStaffForm';

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] text-sm';

interface AddStaffModalProps {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  tenants?: { id: string; name: string }[];
  showTenantSelect?: boolean;
  onSubmit: (data: { name: string; email: string; roleSlug: string; tenantId: string }) => void;
}

export function AddStaffModal({
  open,
  onClose,
  tenantId,
  tenants = [],
  showTenantSelect = false,
  onSubmit,
}: AddStaffModalProps) {
  const [selectedTenantId, setSelectedTenantId] = useState(tenantId);

  useEffect(() => {
    if (open) setSelectedTenantId(tenantId);
  }, [open, tenantId]);

  const handleSubmit = useCallback(
    (data: { name: string; email: string; roleSlug: string }) => {
      const tid = showTenantSelect ? selectedTenantId : tenantId;
      if (!tid) return;
      onSubmit({ ...data, tenantId: tid });
      onClose();
    },
    [selectedTenantId, tenantId, showTenantSelect, onSubmit, onClose]
  );

  return (
    <Modal open={open} onClose={onClose} title="Add Staff" maxWidthRem={28}>
      <ModalHeader title="Add Staff" onClose={onClose} />
      <div className="p-5 space-y-4 bg-[var(--bg-subtle)]/30">
        {showTenantSelect && tenants.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Tenant *</label>
            <PopoverSelect
              value={selectedTenantId}
              onChange={setSelectedTenantId}
              options={tenants.map((t) => ({ value: t.id, label: t.name }))}
              placeholder="Select tenant"
              aria-label="Select tenant"
            />
          </div>
        )}
        <AddStaffForm
          tenantId={showTenantSelect ? selectedTenantId : tenantId}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </Modal>
  );
}
