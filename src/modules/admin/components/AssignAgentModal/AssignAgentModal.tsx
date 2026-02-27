/**
 * Assign agent to tenant modal.
 */

import { useState } from 'react';
import { Modal, ModalHeader, Button } from '../../../../shared/ui';
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
          <select
            id="tenant"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className={inputClass}
            required
            aria-label="Select tenant"
          >
            <option value="">Select tenant</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
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
