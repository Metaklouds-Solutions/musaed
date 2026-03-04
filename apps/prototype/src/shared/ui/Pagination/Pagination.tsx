/**
 * Modern pagination: arrows, circular page numbers, active highlight, faded distant pages.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  /** Current page (1-based). */
  page: number;
  /** Total number of pages. */
  totalPages: number;
  /** Called when page changes. */
  onPageChange: (page: number) => void;
  /** Optional: show page size selector. */
  pageSize?: number;
  /** Total items (for "Showing X–Y of Z"). */
  totalItems?: number;
  className?: string;
}

const MAX_VISIBLE_PAGES = 9;

/** Get page numbers to show. Adjacent = within 1 of current (grey circle). Distant = faded. */
function getPageNumbers(current: number, total: number): { page: number; isAdjacent: boolean }[] {
  if (total <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: total }, (_, i) => {
      const p = i + 1;
      return { page: p, isAdjacent: Math.abs(p - current) <= 1 };
    });
  }
  const result: { page: number; isAdjacent: boolean }[] = [];
  const half = Math.floor(MAX_VISIBLE_PAGES / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + MAX_VISIBLE_PAGES - 1);
  if (end - start + 1 < MAX_VISIBLE_PAGES) {
    start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
  }
  for (let p = start; p <= end; p++) {
    result.push({ page: p, isAdjacent: Math.abs(p - current) <= 1 });
  }
  return result;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-2', className)}
    >
      <button
        type="button"
        onClick={() => canPrev && onPageChange(page - 1)}
        disabled={!canPrev}
        aria-label="Previous page"
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
          canPrev
            ? 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer'
            : 'text-[var(--text-muted)] opacity-50 cursor-not-allowed'
        )}
      >
        <ChevronLeft size={20} strokeWidth={2} aria-hidden />
      </button>

      <div className="flex items-center gap-1.5">
        {pages.map(({ page: p, isAdjacent }) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all duration-200',
              p === page
                ? 'bg-[var(--ds-primary)] text-white shadow-md ring-2 ring-[var(--ds-primary)]/20'
                : isAdjacent
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-60'
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => canNext && onPageChange(page + 1)}
        disabled={!canNext}
        aria-label="Next page"
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
          canNext
            ? 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer'
            : 'text-[var(--text-muted)] opacity-50 cursor-not-allowed'
        )}
      >
        <ChevronRight size={20} strokeWidth={2} aria-hidden />
      </button>

      {totalItems != null && (
        <span className="ml-4 text-sm text-[var(--text-muted)] hidden sm:inline">
          {totalItems} total
        </span>
      )}
    </nav>
  );
}
