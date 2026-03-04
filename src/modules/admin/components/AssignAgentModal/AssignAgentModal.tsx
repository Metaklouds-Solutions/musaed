/**
 * Assign agent to tenant modal.
 */

import { useState } from 'react';
import { Modal, ModalHeader, Button, PopoverSelect } from '../../../../shared/ui';
import type { AdminAgentRow, AdminTenantRow } from '../../../../shared/types';

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)]';

interface AssignAgentModalProps {
  open: boolean;
  onClose: () => void;
  agent: AdminAgentRow | null;
  tenants: AdminTenantRow[];
  onAssign: (tenantId: string) => void;
}

/** Renders modal flow to assign an unassigned platform agent to a tenant. */
export function AssignAgentModal({ open, onClose, agent, tenants, onAssign }: AssignAgentModalProps) {
  const [tenantId, setTenantId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    onAssign(tenantId);
    setTenantId('');
    onClose();
  };

  if (!agent) return null;

  return (
    <Modal open={open} onClose={onClose} title="Assign Agent" maxWidthRem={24}>
      <ModalHeader title="Assign Agent to Tenant" onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1">Agent</p>
          <p className="font-medium text-[var(--text-primary)]">{agent.name} ({agent.voice})</p>
        </div>
        <div>
          <label htmlFor="tenant" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Tenant *
          </label>
          <PopoverSelect
            value={tenantId}
            onChange={setTenantId}
            options={[
              { value: '', label: 'Select tenant' },
              ...tenants.map((t) => ({ value: t.id, label: t.name })),
            ]}
            placeholder="Select tenant"
            aria-label="Select tenant"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--separator)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!tenantId}>
            Assign
          </Button>
        </div>
      </form>
    </Modal>
  );
}
