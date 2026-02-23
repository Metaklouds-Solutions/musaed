/**
 * StatCard primitive. Design-system: card, typography (label small, value prominent).
 * No business logic.
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] p-5',
        'hover:border-[var(--border-default)] hover:bg-[var(--bg-elevated)] transition-colors',
        className
      )}
    >
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}
