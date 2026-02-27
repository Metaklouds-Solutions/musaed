/**
 * Add staff form. Name, email, role.
 */

import { useState } from 'react';
import { Button } from '../../../shared/ui';

const ROLES = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'tenant_owner', label: 'Owner' },
];

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] text-sm';

interface AddStaffFormProps {
  tenantId: string;
  onSubmit: (data: { name: string; email: string; roleSlug: string }) => void;
  onCancel: () => void;
}

export function AddStaffForm({ tenantId, onSubmit, onCancel }: AddStaffFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleSlug, setRoleSlug] = useState('receptionist');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSubmit({ name: name.trim(), email: email.trim(), roleSlug });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dr. Jane Smith"
          className={inputClass}
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@clinic.com"
          className={inputClass}
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Role</label>
        <select
          value={roleSlug}
          onChange={(e) => setRoleSlug(e.target.value)}
          className={inputClass}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={!name.trim() || !email.trim()}>
          Add Staff
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
