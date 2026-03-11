/**
 * Alerts page with summary cards, severity filter, and responsive layout.
 */

import { useMemo, useState, useCallback, type JSX } from 'react';
import { PageHeader, Button, TableSkeleton } from '../../../shared/ui';
import { useAlerts } from '../hooks';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { AlertsList } from '../components/AlertsList';
import { AlertTriangle, CheckCircle, XCircle, Info, RefreshCw } from 'lucide-react';
import type { Alert } from '../../../shared/types';

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type StatusFilter = 'all' | 'active' | 'resolved';

const SEVERITY_OPTIONS: { value: SeverityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'resolved', label: 'Resolved' },
];

function useSummaryCounts(alerts: Alert[]) {
  return useMemo(() => {
    let critical = 0;
    let high = 0;
    let active = 0;
    let resolved = 0;

    for (const a of alerts) {
      if (a.severity === 'critical') critical++;
      if (a.severity === 'high') high++;
      if (a.resolved) resolved++;
      else active++;
    }

    return { critical, high, active, resolved, total: alerts.length };
  }, [alerts]);
}

interface SummaryCardProps {
  icon: JSX.Element;
  label: string;
  value: number;
  color: string;
}

function SummaryCard({ icon, label, value, color }: SummaryCardProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 flex items-center gap-3 min-w-0">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
        <p className="text-xs text-[var(--text-muted)] truncate">{label}</p>
      </div>
    </div>
  );
}

export function AlertsPage() {
  const ready = useDelayedReady();
  const { alerts, resolveAlert } = useAlerts();
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const counts = useSummaryCounts(alerts);

  const filteredAlerts = useMemo(() => {
    let result = alerts;
    if (severityFilter !== 'all') {
      result = result.filter((a) => a.severity === severityFilter);
    }
    if (statusFilter === 'active') {
      result = result.filter((a) => !a.resolved);
    } else if (statusFilter === 'resolved') {
      result = result.filter((a) => a.resolved);
    }
    return result;
  }, [alerts, severityFilter, statusFilter]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  if (!ready) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Alerts"
          description="Credit low, booking drop, and system notifications."
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skel-${i}`}
              className="h-20 rounded-[var(--radius-card)] bg-[var(--bg-card)] border border-[var(--border-subtle)] animate-pulse"
            />
          ))}
        </div>
        <TableSkeleton rows={4} cols={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Alerts"
          description="Credit low, booking drop, and system notifications."
        />
        <Button
          variant="ghost"
          onClick={handleRefresh}
          disabled={refreshing}
          className="shrink-0 p-2 min-h-0"
          aria-label="Refresh alerts"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          icon={<XCircle size={20} className="text-[var(--error)]" />}
          label="Critical"
          value={counts.critical}
          color="rgba(239, 68, 68, 0.1)"
        />
        <SummaryCard
          icon={<AlertTriangle size={20} className="text-orange-500" />}
          label="High"
          value={counts.high}
          color="rgba(249, 115, 22, 0.1)"
        />
        <SummaryCard
          icon={<Info size={20} className="text-[var(--ds-primary)]" />}
          label="Active"
          value={counts.active}
          color="rgba(59, 130, 246, 0.1)"
        />
        <SummaryCard
          icon={<CheckCircle size={20} className="text-[var(--success)]" />}
          label="Resolved"
          value={counts.resolved}
          color="rgba(34, 197, 94, 0.1)"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-[var(--text-muted)] mr-1">Severity:</span>
        {SEVERITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSeverityFilter(opt.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              severityFilter === opt.value
                ? 'bg-[var(--ds-primary)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {opt.label}
          </button>
        ))}

        <span className="text-[var(--border-subtle)] mx-1 hidden sm:inline">|</span>

        <span className="text-sm font-medium text-[var(--text-muted)] mr-1">Status:</span>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              statusFilter === opt.value
                ? 'bg-[var(--ds-primary)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-[var(--text-muted)]">
        Showing {filteredAlerts.length} of {alerts.length} alerts
      </p>

      {/* Alert list */}
      <AlertsList alerts={filteredAlerts} onResolve={resolveAlert} />
    </div>
  );
}
