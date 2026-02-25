/**
 * Unified layout wrapper for main content. Design.json: max 1440px, margin 32px, gutter 24px.
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <div
      className={cn(
        'w-full max-w-[var(--layout-max-width,1440px)] mx-auto',
        'px-[var(--layout-margin)] py-0',
        'box-border',
        className
      )}
    >
      {children}
    </div>
  );
}
