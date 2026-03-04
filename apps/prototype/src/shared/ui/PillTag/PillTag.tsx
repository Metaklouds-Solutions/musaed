/**
 * Pill-shaped tag for Plan, Role, Status, Outcome. Light background + dark text.
 */

import { cn } from '@/lib/utils';

export type PillTagVariant =
  | 'plan'
  | 'role'
  | 'status'
  | 'outcome'
  | 'outcomeBooked'
  | 'outcomeEscalated'
  | 'outcomeFailed'
  | 'outcomePending'
  | 'default';

const variantStyles: Record<PillTagVariant, string> = {
  plan: 'bg-[rgba(124,92,255,0.15)] text-[var(--ds-primary)]',
  role: 'bg-[rgba(59,130,246,0.15)] text-[var(--info)]',
  status: 'bg-[rgba(34,197,94,0.15)] text-[var(--success)]',
  outcome: 'bg-[rgba(234,179,8,0.15)] text-[var(--warning)]',
  outcomeBooked: 'bg-[rgba(34,197,94,0.15)] text-[var(--success)]',
  outcomeEscalated: 'bg-[rgba(245,158,11,0.15)] text-[var(--warning)]',
  outcomeFailed: 'bg-[rgba(239,68,68,0.15)] text-[var(--error)]',
  outcomePending: 'bg-[var(--bg-hover)] text-[var(--text-muted)]',
  default: 'bg-[var(--bg-hover)] text-[var(--text-secondary)]',
};

interface PillTagProps {
  variant?: PillTagVariant;
  children: React.ReactNode;
  className?: string;
}

export function PillTag({ variant = 'default', children, className }: PillTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
