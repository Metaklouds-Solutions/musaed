/**
 * PageHeader primitive. Design-system: H1/H2 typography, spacing.
 * No business logic.
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6', className)}>
      <h1 className="text-[32px] font-bold leading-tight text-[var(--text-primary)]">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-sm text-[var(--text-secondary)] leading-normal max-w-2xl">
          {description}
        </p>
      )}
    </header>
  );
}
