/**
 * EmptyState primitive. Design-system: icon xl, text hierarchy, spacing.
 * No business logic.
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className
      )}
    >
      <div
        className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-6"
        aria-hidden
      >
        <Icon className="w-8 h-8 text-[var(--text-muted)]" />
      </div>
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
        {title}
      </h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md">
        {description}
      </p>
      {children}
    </div>
  );
}
