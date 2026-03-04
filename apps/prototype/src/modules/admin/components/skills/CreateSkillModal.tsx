/**
 * Create skill modal. Form for new skill definition.
 */

import { useState } from 'react';
import { Modal, ModalHeader, Button, PopoverSelect } from '../../../../shared/ui';
import type { SkillDefinition } from '../../../../shared/types';

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] text-sm';

const CATEGORY_OPTIONS = [
  { value: 'core', label: 'Core' },
  { value: 'specialty', label: 'Specialty' },
  { value: 'custom', label: 'Custom' },
];

const SCOPE_OPTIONS = [
  { value: 'platform', label: 'Platform' },
  { value: 'tenant', label: 'Tenant' },
];

const DEFAULT_FLOW = { nodes: [], entry_prompt: '' };

interface CreateSkillModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<SkillDefinition, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function CreateSkillModal({ open, onClose, onSubmit }: CreateSkillModalProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SkillDefinition['category']>('core');
  const [entryConditions, setEntryConditions] = useState('');
  const [flowDefinitionJson, setFlowDefinitionJson] = useState(JSON.stringify(DEFAULT_FLOW, null, 2));
  const [scope, setScope] = useState<SkillDefinition['scope']>('platform');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let flowDef: Record<string, unknown>;
    try {
      flowDef = JSON.parse(flowDefinitionJson);
    } catch {
      flowDef = DEFAULT_FLOW;
    }
    const key = name.trim() || displayName.toLowerCase().replace(/\s+/g, '_');
    onSubmit({
      name: key,
      displayName: displayName.trim() || key,
      description: description.trim(),
      category,
      flowDefinition: flowDef,
      entryConditions: entryConditions.trim() || undefined,
      retellSyncStatus: 'draft',
      scope,
      isActive: true,
      version: 1,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Skill" maxWidthRem={40}>
      <ModalHeader title="Create Skill" onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Name (key) *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="appointment_booking"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Display Name *</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Appointment Booking"
              className={inputClass}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Category</label>
            <PopoverSelect value={category} onChange={(v) => setCategory(v as SkillDefinition['category'])} options={CATEGORY_OPTIONS} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Scope</label>
            <PopoverSelect value={scope} onChange={(v) => setScope(v as SkillDefinition['scope'])} options={SCOPE_OPTIONS} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Full booking flow: ask date, check availability..."
            className={inputClass}
            rows={2}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Entry Conditions</label>
          <input
            type="text"
            value={entryConditions}
            onChange={(e) => setEntryConditions(e.target.value)}
            placeholder="patient mentions booking, appointment, schedule"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Flow Definition (JSON)</label>
          <textarea
            value={flowDefinitionJson}
            onChange={(e) => setFlowDefinitionJson(e.target.value)}
            className={`${inputClass} font-mono text-xs min-h-[120px]`}
          />
        </div>
        <div className="flex gap-3 pt-2 border-t border-[var(--border-subtle)] mt-4 pt-4">
          <Button type="submit" disabled={!displayName.trim()}>
            Create Skill
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
