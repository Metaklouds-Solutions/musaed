/**
 * Calls list page. Layout only; data from useCallsList hook.
 * Saved filters: save/apply view presets. Uses adapters for export only.
 */

import { useMemo, useState, useCallback } from 'react';
import { PageHeader, EmptyState, TableFilters, Button, SavedFiltersDropdown, TableSkeleton, StatCard, LOTTIE_ASSETS } from '../../../shared/ui';
import { useSavedFilters } from '../../../shared/hooks/useSavedFilters';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { DateRangePicker } from '../../../components/DateRangePicker';
import { useCallsList, useCallsExport, useCallAnalytics } from '../hooks';
import { CallsTable } from '../components/CallsTable';
import { OutcomeBreakdown } from '../../reports/components/OutcomeBreakdown';
import { SentimentChart } from '../../reports/components/SentimentChart/SentimentChart';
import { Skeleton } from '../../../shared/ui';
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

/** Formats avg duration in seconds to display: 44 → "44s", 90 → "1:30". */
function formatAvgDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Tenant calls list: filters, stats, export. Data from useCallsList and useCallAnalytics hooks. */
export function CallsPage() {
  const ready = useDelayedReady();
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const dateRangeFilter = useMemo(() => ({ start: dateRange.start, end: dateRange.end }), [dateRange]);
  const { user, calls, customerMap } = useCallsList(dateRangeFilter);
  const { analytics, isLoading: analyticsLoading } = useCallAnalytics(dateRangeFilter);
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

  const outcomesForChart = useMemo(() => {
    const { outcomes } = analytics;
    const total = analytics.totalCalls;
    const toPct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return [
      { outcome: 'booked' as const, count: outcomes.booked, percentage: toPct(outcomes.booked) },
      { outcome: 'escalated' as const, count: outcomes.escalated, percentage: toPct(outcomes.escalated) },
      { outcome: 'failed' as const, count: outcomes.failed, percentage: toPct(outcomes.failed) },
      { outcome: 'info_only' as const, count: outcomes.info_only, percentage: toPct(outcomes.info_only) },
    ];
  }, [analytics]);

  const sentimentBuckets = useMemo(() => {
    const { sentiment } = analytics;
    const total = analytics.totalCalls;
    const toPct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return [
      { label: 'Positive', range: '0.6–1', count: sentiment.positive, percentage: toPct(sentiment.positive) },
      { label: 'Neutral', range: '0.4–0.6', count: sentiment.neutral, percentage: toPct(sentiment.neutral) },
      { label: 'Negative', range: '0–0.4', count: sentiment.negative, percentage: toPct(sentiment.negative) },
    ];
  }, [analytics]);

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
        {analyticsLoading ? (
          <>
            <Skeleton className="h-20 rounded-[var(--radius-card)]" />
            <Skeleton className="h-20 rounded-[var(--radius-card)]" />
            <Skeleton className="h-20 rounded-[var(--radius-card)]" />
          </>
        ) : (
          <>
            <StatCard label="Total calls" value={analytics.totalCalls} />
            <StatCard
              label="Conversation rate"
              value={`${Math.round(analytics.conversationRate * 100)}%`}
            />
            <StatCard
              label="Avg duration"
              value={formatAvgDuration(analytics.avgDuration)}
            />
          </>
        )}
        <div className="sm:col-span-2 lg:col-span-1">
          {analyticsLoading ? (
            <Skeleton className="h-32 rounded-[var(--radius-card)]" />
          ) : (
            <OutcomeBreakdown outcomes={outcomesForChart} />
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {analyticsLoading ? (
          <Skeleton className="h-48 rounded-[var(--radius-card)]" />
        ) : (
          <SentimentChart buckets={sentimentBuckets} />
        )}
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
