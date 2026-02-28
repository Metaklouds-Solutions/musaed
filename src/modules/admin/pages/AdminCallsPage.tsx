/**
 * Admin Calls: Cross-tenant call list.
 */

import { useMemo, useState, useCallback } from 'react';
import { PageHeader, EmptyState, TableFilters, Button } from '../../../shared/ui';
import { DateRangePicker } from '../../../components/DateRangePicker';
import { useCallsList } from '../../calls/hooks';
import { CallsTable } from '../../calls/components/CallsTable';
import { tenantsAdapter, exportAdapter } from '../../../adapters';
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

export function AdminCallsPage() {
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const [outcomeFilter, setOutcomeFilter] = useState<string | null>(null);

  const dateRangeFilter = useMemo(() => ({ start: dateRange.start, end: dateRange.end }), [dateRange]);
  const { user, calls, customerMap } = useCallsList(dateRangeFilter);

  const tenantMap = useMemo(() => {
    const m = new Map<string, string>();
    tenantsAdapter.getAllTenants().forEach((t) => m.set(t.id, t.name));
    return m;
  }, []);

  const filteredCalls = useMemo(() => {
    if (!outcomeFilter) return calls;
    return calls.filter((c) => getOutcome(c) === outcomeFilter);
  }, [calls, outcomeFilter]);

  const handleExport = useCallback(() => {
    const rows = filteredCalls.map((c) => ({
      Tenant: tenantMap.get(c.tenantId) ?? c.tenantId,
      Date: new Date(c.createdAt).toLocaleDateString(),
      Customer: customerMap.get(c.customerId) ?? c.customerId,
      Duration: `${Math.floor(c.duration / 60)}:${(c.duration % 60).toString().padStart(2, '0')}`,
      Sentiment: c.sentimentScore.toFixed(2),
      Outcome: getOutcome(c),
    }));
    exportAdapter.exportCsv(rows, `admin-calls-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Calls exported');
  }, [filteredCalls, customerMap, tenantMap]);

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
