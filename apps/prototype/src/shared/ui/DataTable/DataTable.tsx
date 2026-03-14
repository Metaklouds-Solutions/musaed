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
  /** When "plain", omit card styling (use when table is inside another card) */
  variant?: 'card' | 'plain';
  /** When true, rows get light purple background and rounded corners */
  rowsTinted?: boolean;
}

export function DataTable({
  children,
  minWidth = 'min-w-[480px] sm:min-w-[640px]',
  className,
  variant = 'card',
  rowsTinted = false,
}: DataTableProps) {
  return (
    <div
      className={cn(
        'w-full min-w-0',
        'overflow-x-auto overscroll-contain scroll-smooth data-table-scroll',
        variant === 'card' && 'rounded-[var(--radius-card)] card-glass',
        rowsTinted && 'data-table-rows-tinted',
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
