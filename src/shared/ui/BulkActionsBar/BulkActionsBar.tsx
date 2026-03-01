/**
 * Bulk actions bar. Shown when rows are selected. [PHASE-7-BULK-ACTIONS]
 */

import { Button } from '../Button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionsBarProps {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
  className?: string;
}

export function BulkActionsBar({ count, onClear, children, className }: BulkActionsBarProps) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3 rounded-xl',
        'bg-[var(--ds-primary)]/10 border border-[var(--ds-primary)]/20',
        className
      )}
    >
      <span className="text-sm font-medium text-[var(--text-primary)]">
        {count} selected
      </span>
      <div className="flex items-center gap-2">
        {children}
        <Button variant="ghost" size="sm" onClick={onClear} aria-label="Clear selection">
          <X size={16} aria-hidden />
          Clear
        </Button>
      </div>
    </div>
  );
}
