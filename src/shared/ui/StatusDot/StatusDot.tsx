/**
 * Small colored dot for status (active, offline). Optional label.
 */

import { cn } from '@/lib/utils';

export type StatusDotVariant = 'active' | 'offline' | 'warning' | 'error';

const dotColors: Record<StatusDotVariant, string> = {
  active: 'bg-[var(--success)]',
  offline: 'bg-[var(--text-muted)]',
  warning: 'bg-[var(--warning)]',
  error: 'bg-[var(--error)]',
};

interface StatusDotProps {
  variant?: StatusDotVariant;
  label?: string;
  className?: string;
}

export function StatusDot({ variant = 'active', label, className }: StatusDotProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn('h-2 w-2 shrink-0 rounded-full', dotColors[variant])}
        aria-hidden
      />
      {label && (
        <span className="text-sm text-[var(--text-secondary)] capitalize">{label}</span>
      )}
    </span>
  );
}
