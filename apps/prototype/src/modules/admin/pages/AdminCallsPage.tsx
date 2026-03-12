/**
 * Admin Calls: Cross-tenant call list.
 */

import { useMemo, useState, useCallback } from 'react';
import { PageHeader, EmptyState, TableFilters, Button, StatCard, Skeleton } from '../../../shared/ui';
import { DateRangePicker } from '../../../components/DateRangePicker';
import { useCallsList, useCallAnalytics } from '../../calls/hooks';
import { CallsTable } from '../../calls/components/CallsTable';
import { OutcomeBreakdown } from '../../reports/components/OutcomeBreakdown';
import { SentimentChart } from '../../reports/components/SentimentChart/SentimentChart';
import { toast } from 'sonner';
import { Phone, Download } from 'lucide-react';
import { useAdminCalls } from '../hooks';

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

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString();
}

/** Formats avg duration in seconds: 44 → "44s", 90 → "1:30". */
function formatAvgDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Renders cross-tenant admin calls list with analytics, export, and outcome filters. */
export function AdminCallsPage() {
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const [outcomeFilter, setOutcomeFilter] = useState<string | null>(null);

  const dateRangeFilter = useMemo(() => ({ start: dateRange.start, end: dateRange.end }), [dateRange]);
  const { user, calls, customerMap } = useCallsList(dateRangeFilter);
  const { analytics, isLoading: analyticsLoading } = useCallAnalytics(dateRangeFilter);
  const { tenantMap, exportCallsCsv } = useAdminCalls();

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

  const filteredCalls = useMemo(() => {
    if (!outcomeFilter) return calls;
    return calls.filter((c) => getOutcome(c) === outcomeFilter);
  }, [calls, outcomeFilter]);

  const handleExport = useCallback(() => {
    const rows = filteredCalls.map((c) => ({
      Tenant: tenantMap.get(c.tenantId) ?? c.tenantId,
      Date: formatDate(c.createdAt),
      Customer: customerMap.get(c.customerId) ?? c.customerId,
      Duration: `${Math.floor(c.duration / 60)}:${(c.duration % 60).toString().padStart(2, '0')}`,
      Sentiment: c.sentimentScore.toFixed(2),
      Outcome: getOutcome(c),
    }));
    exportCallsCsv(rows, `admin-calls-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Calls exported');
  }, [filteredCalls, customerMap, tenantMap, exportCallsCsv]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <EmptyState
        icon={Phone}
        title="Admin access required"
        description="Sign in as admin to view cross-tenant calls."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Calls"
          description="Cross-tenant call list"
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
      </div>

      {filteredCalls.length === 0 ? (
            <div className="rounded-[var(--radius-card)] card-glass p-8">
              <EmptyState
                icon={Phone}
                title="No calls"
                description="No calls match the selected filters."
              />
            </div>
          ) : (
        <CallsTable
          calls={filteredCalls}
          getCustomerName={(id) => customerMap.get(id) ?? id}
          viewBasePath="/admin/calls"
          getTenantName={(id) => tenantMap.get(id) ?? id}
        />
      )}
    </div>
  );
}
