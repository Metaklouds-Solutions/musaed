/**
 * Edit skill modal. Pre-populated form for updating skill definition.
 */

import { useState, useEffect } from 'react';
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

interface EditSkillModalProps {
  skill: SkillDefinition | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, patch: Partial<Omit<SkillDefinition, 'id' | 'createdAt'>>) => void;
}

export function EditSkillModal({ skill, open, onClose, onSubmit }: EditSkillModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SkillDefinition['category']>('core');
  const [entryConditions, setEntryConditions] = useState('');
  const [flowDefinitionJson, setFlowDefinitionJson] = useState('{}');

  useEffect(() => {
    if (skill) {
      setDisplayName(skill.displayName);
      setDescription(skill.description);
      setCategory(skill.category);
      setEntryConditions(skill.entryConditions ?? '');
      setFlowDefinitionJson(JSON.stringify(skill.flowDefinition, null, 2));
    }
  }, [skill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skill) return;
    let flowDef: Record<string, unknown>;
    try {
      flowDef = JSON.parse(flowDefinitionJson);
    } catch {
      flowDef = skill.flowDefinition;
    }
    onSubmit(skill.id, {
      displayName: displayName.trim(),
      description: description.trim(),
      category,
      flowDefinition: flowDef,
      entryConditions: entryConditions.trim() || undefined,
    });
    onClose();
  };

  if (!skill) return null;

  return (
    <Modal open={open} onClose={onClose} title="Edit Skill" maxWidthRem={32}>
      <ModalHeader title={`Edit ${skill.displayName}`} onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Display Name *</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={2} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Category</label>
          <PopoverSelect value={category} onChange={(v) => setCategory(v as SkillDefinition['category'])} options={CATEGORY_OPTIONS} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Entry Conditions</label>
          <input type="text" value={entryConditions} onChange={(e) => setEntryConditions(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Flow Definition (JSON)</label>
          <textarea
            value={flowDefinitionJson}
            onChange={(e) => setFlowDefinitionJson(e.target.value)}
            className={`${inputClass} font-mono text-xs min-h-[120px]`}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={!displayName.trim()}>
            Save Changes
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
