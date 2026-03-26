/**
 * Reports page skeleton. Matches layout: metrics row + 4 chart cards + outcomes chart.
 */

import { Skeleton } from '../../../../shared/ui';

/** Skeleton placeholder matching Reports page layout. */
export function ReportsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading analytics">
      {/* Performance metrics row */}
      <div className="rounded-[var(--radius-card)] card p-5">
        <Skeleton className="h-5 w-36 rounded mb-4" />
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg panel-soft p-4 min-w-0"
            >
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-5 w-12 rounded mt-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart grid: 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[240px] rounded-xl card p-5 overflow-hidden"
          >
            <Skeleton className="h-4 w-28 rounded mb-4" />
            <div className="space-y-3 mt-6">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-16 w-full rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Outcomes over time chart */}
      <div className="rounded-xl card p-5 min-h-[180px]">
        <Skeleton className="h-4 w-40 rounded mb-4" />
        <div className="flex gap-2 items-end h-28">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 min-w-[40px] h-20 rounded-t" />
          ))}
        </div>
      </div>
    </div>
  );
}

