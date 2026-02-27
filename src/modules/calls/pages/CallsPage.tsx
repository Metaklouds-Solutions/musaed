/**
 * Calls list page. Layout only; data from useCallsList hook.
 */

import { useMemo, useState, useCallback } from 'react';
import { PageHeader, EmptyState, TableFilters, Button } from '../../../shared/ui';
import { DateRangePicker } from '../../../components/DateRangePicker';
import { useCallsList } from '../hooks';
import { CallsTable } from '../components/CallsTable';
import { exportAdapter } from '../../../adapters';
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

export function CallsPage() {
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const dateRangeFilter = useMemo(() => ({ start: dateRange.start, end: dateRange.end }), [dateRange]);
  const { user, calls, customerMap } = useCallsList(dateRangeFilter);
  const [outcomeFilter, setOutcomeFilter] = useState<string | null>(null);

  const filteredCalls = useMemo(() => {
    if (!outcomeFilter) return calls;
    return calls.filter((c) => getOutcome(c) === outcomeFilter);
  }, [calls, outcomeFilter]);

  const handleExport = useCallback(() => {
    const rows = filteredCalls.map((c) => ({
      Date: new Date(c.createdAt).toLocaleDateString(),
      Customer: customerMap.get(c.customerId) ?? c.customerId,
      Duration: `${Math.floor(c.duration / 60)}:${(c.duration % 60).toString().padStart(2, '0')}`,
      Sentiment: c.sentimentScore.toFixed(2),
      Outcome: getOutcome(c),
    }));
    exportAdapter.exportCsv(rows, `calls-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Calls exported');
  }, [filteredCalls, customerMap]);

  if (!user) {
    return (
      <EmptyState
        icon={Phone}
        title="Sign in to view calls"
        description="Select a role on the login page to see call logs."
      />
    );
  }

  if (calls.length === 0) {
    return (
      <EmptyState
        icon={Phone}
        title="No calls yet"
        description="Call logs will appear when data is available from the adapter."
      />
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
      <TableFilters
        outcomes={[
          { value: 'booked', label: 'Booked' },
          { value: 'escalated', label: 'Escalated' },
          { value: 'failed', label: 'Failed' },
        ]}
        selectedOutcome={outcomeFilter}
        onOutcomeChange={setOutcomeFilter}
      />
      <CallsTable
        calls={filteredCalls}
        getCustomerName={(id) => customerMap.get(id) ?? id}
      />
    </div>
  );
}
