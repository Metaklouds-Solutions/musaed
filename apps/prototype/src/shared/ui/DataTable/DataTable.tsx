/**
 * Responsive table wrapper. Horizontal scroll on small screens.
 * overflow-x-auto (not overflow-hidden) so table scrolls on narrow viewports.
 */

import { cn } from '@/lib/utils';

interface DataTableProps {
  children: React.ReactNode;
  /** Min width for table (enables horizontal scroll when needed) */
  minWidth?: string;
  className?: string;
}

export function DataTable({ children, minWidth = 'min-w-[480px] sm:min-w-[640px]', className }: DataTableProps) {
  return (
    <div
      className={cn(
        'w-full min-w-0',
        'overflow-x-auto overscroll-contain scroll-smooth',
        'rounded-[var(--radius-card)] card-glass',
        className
      )}
      style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      <div className={cn(minWidth, 'inline-block w-full')}>
        {children}
      </div>
    </div>
  );
}
