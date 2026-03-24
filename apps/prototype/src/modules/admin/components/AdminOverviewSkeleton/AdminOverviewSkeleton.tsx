/**
 * Skeleton loader for Admin Overview page. Matches layout and card structure.
 */

import { Skeleton } from '../../../../shared/ui';

/** Skeleton for admin dashboard: header, signal, KPIs, recent tenants/calls, support. */
export function AdminOverviewSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading admin dashboard">
      {/* Header */}
      <header className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 max-w-full rounded" />
        </div>
      </header>

      {/* Signal + health section */}
      <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/90 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <Skeleton className="h-5 w-48 sm:w-64 rounded" />
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-4 w-8 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-8 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-4 w-10 rounded" />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Pulse */}
      <section className="space-y-4">
        <Skeleton className="h-6 w-36 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-[var(--radius-card)] card-glass p-5">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="mt-2 h-8 w-16 rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* Recent Tenants + Recent Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[var(--radius-card)] card-glass p-5">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32 rounded" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
          <ul className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="rounded-lg bg-[var(--ds-primary)]/5 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-28 rounded" />
                  <div className="flex items-center gap-2 shrink-0">
                    <Skeleton className="h-6 w-14 rounded-full" />
                    <Skeleton className="h-4 w-20 rounded" />
                  </div>
                </div>
                <Skeleton className="mt-2 h-3 w-40 rounded" />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--radius-card)] card-glass p-5">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-28 rounded" />
          </div>
          <ul className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="rounded-lg bg-[var(--ds-primary)]/5 px-3 py-3">
                <Skeleton className="h-4 w-36 rounded" />
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-12 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Support Snapshot skeleton (compact) */}
      <section className="rounded-[var(--radius-card)] card-glass p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-44 rounded" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl panel-soft p-4"
            >
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="mt-2 h-8 w-12 rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
