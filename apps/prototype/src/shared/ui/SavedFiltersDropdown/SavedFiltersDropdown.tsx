/**
 * Dropdown for saved filters: apply, save current.
 */

import { useState, useCallback } from 'react';
import { Bookmark, Plus, Check } from 'lucide-react';
import { Button } from '../Button';
import { PopoverSelect } from '../PopoverSelect';
import { cn } from '@/lib/utils';
import type { SavedFilter } from '../../../adapters/local/savedFilters.adapter';

interface SavedFiltersDropdownProps {
  saved: SavedFilter[];
  onSave: (name: string) => void;
  onApply: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function SavedFiltersDropdown({
  saved,
  onSave,
  onApply,
  onDelete: _onDelete,
  className,
}: SavedFiltersDropdownProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

  const handleSave = useCallback(() => {
    const name = saveName.trim();
    if (name) {
      onSave(name);
      setSaveName('');
      setSaveOpen(false);
    }
  }, [saveName, onSave]);

  if (saveOpen) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <input
          type="text"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder="View name"
          className="w-32 px-2 py-1.5 text-sm rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)]/30"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setSaveOpen(false);
          }}
          autoFocus
        />
        <Button variant="secondary" className="h-8 px-2" onClick={handleSave}>
          <Check className="w-4 h-4" />
        </Button>
        <Button variant="ghost" className="h-8 px-2" onClick={() => setSaveOpen(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  if (saved.length === 0) {
    return (
      <Button
        variant="ghost"
        className={cn('text-sm h-8', className)}
        onClick={() => setSaveOpen(true)}
      >
        <Bookmark className="w-4 h-4" aria-hidden />
        Save view
      </Button>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <PopoverSelect
        value=""
        onChange={(id) => id && onApply(id)}
        options={saved.map((f) => ({ value: f.id, label: f.name }))}
        placeholder="Saved views"
        title="Apply saved view"
        aria-label="Apply saved filter view"
        triggerClassName="min-w-[120px] h-8"
      />
      <Button
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={() => setSaveOpen(true)}
        aria-label="Save current view"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
