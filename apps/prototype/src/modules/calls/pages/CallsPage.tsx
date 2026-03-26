/**
 * Calls list page. Layout only; data from useCallsList hook.
 * Uses adapters for export only.
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import { PageHeader, EmptyState, Button, TableSkeleton, LOTTIE_ASSETS, Pagination, UnifiedFilterBar } from '../../../shared/ui';
import { DateRangePicker } from '../../../components/DateRangePicker';
import { useCallsList, useCallsExport } from '../hooks';
import { CallsTable } from '../components/CallsTable';
import { toast } from 'sonner';
import { Phone, Download } from 'lucide-react';
import { useSavedFilters } from '../../../shared/hooks/useSavedFilters';
import { useUrlQueryState } from '../../../shared/hooks/useUrlQueryState';

function getOutcome(call: { bookingCreated: boolean; escalationFlag: boolean }): 'booked' | 'escalated' | 'failed' {
  if (call.bookingCreated) return 'booked';
  if (call.escalationFlag) return 'escalated';
  return 'failed';
}

const DEFAULT_RANGE = (() => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { start, end };
})();

const PAGE_SIZE = 20;

/** Tenant calls list: table-first log with filters, export, and pagination. */
export function CallsPage() {
  const { state, patchState, resetState } = useUrlQueryState({
    tab: 'all',
    q: '',
    from: '',
    to: '',
  });
  const [dateRange, setDateRange] = useState(() => {
    if (state.from && state.to) {
      const start = new Date(state.from);
      const end = new Date(state.to);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        return { start, end };
      }
    }
    return DEFAULT_RANGE;
  });
  const dateRangeFilter = useMemo(() => ({ start: dateRange.start, end: dateRange.end }), [dateRange]);
  const { user, calls, customerMap, isLoading } = useCallsList(dateRangeFilter);
  const { exportCallsCsv } = useCallsExport();
  const [page, setPage] = useState(1);
  const outcomeFilter = state.tab === 'all' ? null : state.tab;
  const searchQuery = state.q;

  const { saved, saveCurrent, apply, deleteFilter } = useSavedFilters({
    pageKey: 'tenant-calls',
    currentFilters: {
      tab: state.tab,
      q: state.q,
      from: dateRange.start.toISOString(),
      to: dateRange.end.toISOString(),
    },
    onApply: (filters) => {
      patchState({
        tab: typeof filters.tab === 'string' ? filters.tab : 'all',
        q: typeof filters.q === 'string' ? filters.q : '',
      });
      if (typeof filters.from === 'string' && typeof filters.to === 'string') {
        const start = new Date(filters.from);
        const end = new Date(filters.to);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
          setDateRange({ start, end });
        }
      }
    },
  });

  const filteredCalls = useMemo(() => {
    const byOutcome = outcomeFilter ? calls.filter((c) => getOutcome(c) === outcomeFilter) : calls;
    if (!searchQuery.trim()) return byOutcome;
    const q = searchQuery.trim().toLowerCase();
    return byOutcome.filter((c) => {
      const customer = (customerMap.get(c.customerId) ?? '').toLowerCase();
      const callId = (c.callId ?? c.id).toLowerCase();
      return customer.includes(q) || callId.includes(q);
    });
  }, [calls, outcomeFilter, searchQuery, customerMap]);

  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const paginatedCalls = useMemo(
    () => filteredCalls.slice(pageStart, pageEnd),
    [filteredCalls, pageStart, pageEnd],
  );

  useEffect(() => {
    setPage(1);
  }, [outcomeFilter, dateRange.start, dateRange.end, searchQuery]);

  useEffect(() => {
    patchState({
      from: dateRange.start.toISOString(),
      to: dateRange.end.toISOString(),
    });
  }, [dateRange.start, dateRange.end, patchState]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleExport = useCallback(() => {
    exportCallsCsv(
      filteredCalls,
      (id) => customerMap.get(id) ?? id,
      `calls-${new Date().toISOString().slice(0, 10)}.csv`
    );
    toast.success('Calls exported');
  }, [filteredCalls, customerMap, exportCallsCsv]);

  if (!user) {
    return (
      <EmptyState
        icon={Phone}
        title="Sign in to view calls"
        description="Select a role on the login page to see call logs."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader title="Calls" description="AI call logs with filtering and export." />
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="h-10 w-[200px] rounded-lg bg-[var(--bg-subtle)] animate-pulse" aria-hidden />
            <div className="h-10 w-24 rounded-lg bg-[var(--bg-subtle)] animate-pulse" aria-hidden />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-9 w-20 rounded-md bg-[var(--bg-subtle)] animate-pulse" aria-hidden />
          <div className="h-9 w-24 rounded-md bg-[var(--bg-subtle)] animate-pulse" aria-hidden />
          <div className="h-9 w-20 rounded-md bg-[var(--bg-subtle)] animate-pulse" aria-hidden />
        </div>
        <TableSkeleton rows={10} cols={7} minWidth="min-w-[720px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Calls"
          description="AI call logs with filtering and export."
        />
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4" aria-hidden />
            Export CSV
          </Button>
        </div>
      </div>
      {calls.length === 0 ? (
        <div className="rounded-[var(--radius-card)] card-glass p-8">
          <EmptyState
            icon={Phone}
            title="No calls in this date range"
            description="Try selecting a different date range above. Call logs will appear when data is available for your selection."
            lottieSrc={LOTTIE_ASSETS.empty}
          />
        </div>
      ) : (
        <>
          <UnifiedFilterBar
            tabs={[
              { value: 'all', label: 'All' },
              { value: 'booked', label: 'Booked' },
              { value: 'escalated', label: 'Escalated' },
              { value: 'failed', label: 'Failed' },
            ]}
            activeTab={state.tab}
            onTabChange={(tab) => patchState({ tab })}
            query={searchQuery}
            onQueryChange={(q) => patchState({ q })}
            searchPlaceholder="Search by customer or call ID..."
            savedFilters={saved}
            onSaveFilter={saveCurrent}
            onApplyFilter={apply}
            onDeleteFilter={deleteFilter}
            activeFilterCount={state.tab !== 'all' ? 1 : 0}
            onReset={() => {
              resetState();
              setDateRange(DEFAULT_RANGE);
            }}
            rightSlot={
              <DateRangePicker value={dateRange} onChange={setDateRange} aria-label="Filter by date range" />
            }
          />
          {filteredCalls.length === 0 ? (
            <div className="rounded-[var(--radius-card)] card-glass p-6">
              <p className="text-sm text-[var(--text-muted)]">
                No calls match the selected filters.
              </p>
            </div>
          ) : (
            <>
              <CallsTable
                calls={paginatedCalls}
                getCustomerName={(id) => customerMap.get(id) ?? id}
              />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                <p className="text-sm text-[var(--text-muted)]">
                  Showing {pageStart + 1}-{Math.min(pageEnd, filteredCalls.length)} of {filteredCalls.length} calls
                </p>
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={filteredCalls.length}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
