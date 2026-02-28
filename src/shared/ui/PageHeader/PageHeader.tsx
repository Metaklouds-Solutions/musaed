/**
 * Page header with title and optional description.
 * Design.json: display 32px/600, description body/caption.
 * @param title - Main heading text
 * @param description - Optional subtitle or ReactNode
 * @param className - Additional CSS classes
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
    <header className={cn('mb-8', className)}>
      <h1 className="text-[var(--typography-display)] font-semibold leading-tight tracking-[-0.5px] text-[var(--text-primary)]">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-[var(--typography-body)] text-[var(--text-secondary)] leading-normal max-w-2xl">
          {description}
        </p>
      )}
    </header>
  );
}
