/**
 * Calls list page. Layout only; data from useCallsList hook.
 * Saved filters: save/apply view presets. Uses adapters for export only.
 */

import { useMemo, useState, useCallback } from 'react';
import { PageHeader, EmptyState, TableFilters, Button, SavedFiltersDropdown, TableSkeleton, StatCard, LOTTIE_ASSETS } from '../../../shared/ui';
import { useSavedFilters } from '../../../shared/hooks/useSavedFilters';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { DateRangePicker } from '../../../components/DateRangePicker';
import { useCallsList, useCallsExport } from '../hooks';
import { CallsTable } from '../components/CallsTable';
import { OutcomeBreakdown } from '../../reports/components/OutcomeBreakdown';
import { toast } from 'sonner';
import { Phone, Download } from 'lucide-react';

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

/** Tenant calls list: filters, stats, export. Data from useCallsList hook. */
export function CallsPage() {
  const ready = useDelayedReady();
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const dateRangeFilter = useMemo(() => ({ start: dateRange.start, end: dateRange.end }), [dateRange]);
  const { user, calls, customerMap } = useCallsList(dateRangeFilter);
  const { exportCallsCsv } = useCallsExport();
  const [outcomeFilter, setOutcomeFilter] = useState<string | null>(null);

  const currentFilters = useMemo(
    () => ({
      outcome: outcomeFilter,
      dateRangeStart: dateRange.start.toISOString(),
      dateRangeEnd: dateRange.end.toISOString(),
    }),
    [outcomeFilter, dateRange]
  );

  const handleApplyFilters = useCallback((f: Record<string, unknown>) => {
    const outcome = typeof f.outcome === 'string' ? f.outcome : null;
    setOutcomeFilter(outcome || null);
    if (typeof f.dateRangeStart === 'string' && typeof f.dateRangeEnd === 'string') {
      const nextStart = new Date(f.dateRangeStart);
      const nextEnd = new Date(f.dateRangeEnd);
      if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime())) return;
      setDateRange({
        start: nextStart,
        end: nextEnd,
      });
    }
  }, []);

  const savedFilters = useSavedFilters({
    pageKey: 'calls',
    currentFilters,
    onApply: handleApplyFilters,
  });

  const filteredCalls = useMemo(() => {
    if (!outcomeFilter) return calls;
    return calls.filter((c) => getOutcome(c) === outcomeFilter);
  }, [calls, outcomeFilter]);

  const callSummary = useMemo(() => {
    const total = calls.length;
    const booked = calls.filter((c) => c.bookingCreated).length;
    const escalated = calls.filter((c) => c.escalationFlag && !c.bookingCreated).length;
    const failed = total - booked - escalated;
    const totalDuration = calls.reduce((s, c) => s + c.duration, 0);
    const avgDurationSec = total > 0 ? Math.round(totalDuration / total) : 0;
    const conversionRate = total > 0 ? Math.round((booked / total) * 100) : 0;
    const outcomes = [
      { outcome: 'booked' as const, count: booked, percentage: total > 0 ? Math.round((booked / total) * 100) : 0 },
      { outcome: 'escalated' as const, count: escalated, percentage: total > 0 ? Math.round((escalated / total) * 100) : 0 },
      { outcome: 'failed' as const, count: failed, percentage: total > 0 ? Math.round((failed / total) * 100) : 0 },
    ];
    return { total, conversionRate, avgDurationSec, outcomes };
  }, [calls]);

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

  if (!ready) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader title="Calls" description="AI call logs and conversion." />
        </div>
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Calls"
          description="AI call logs and conversion."
        />
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <DateRangePicker value={dateRange} onChange={setDateRange} aria-label="Filter by date range" />
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4" aria-hidden />
            Export CSV
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total calls" value={callSummary.total} />
        <StatCard label="Conversion rate" value={`${callSummary.conversionRate}%`} />
        <StatCard
          label="Avg duration"
          value={`${Math.floor(callSummary.avgDurationSec / 60)}:${(callSummary.avgDurationSec % 60).toString().padStart(2, '0')}`}
        />
        <div className="sm:col-span-2 lg:col-span-1">
          <OutcomeBreakdown outcomes={callSummary.outcomes} />
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
          <div className="flex flex-wrap items-center gap-3">
            <TableFilters
              outcomes={[
                { value: 'booked', label: 'Booked' },
                { value: 'escalated', label: 'Escalated' },
                { value: 'failed', label: 'Failed' },
              ]}
              selectedOutcome={outcomeFilter}
              onOutcomeChange={setOutcomeFilter}
            />
            <SavedFiltersDropdown
              saved={savedFilters.saved}
              onSave={(name) => {
                savedFilters.saveCurrent(name);
                toast.success(`View "${name}" saved`);
              }}
              onApply={savedFilters.apply}
              onDelete={savedFilters.deleteFilter}
            />
          </div>
          <CallsTable
            calls={filteredCalls}
            getCustomerName={(id) => customerMap.get(id) ?? id}
          />
        </>
      )}
    </div>
  );
}
