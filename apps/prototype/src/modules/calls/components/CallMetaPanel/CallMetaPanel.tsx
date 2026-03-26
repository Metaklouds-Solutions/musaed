/**
 * Call meta panel: duration, date, escalation, booking. Data from props only.
 */

import type { Call } from '../../../../shared/types';
import type { Booking } from '../../../../shared/types';

interface CallMetaPanelProps {
  call: Call;
  linkedBooking?: Booking | null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCost(cost: number | null | undefined): string {
  if (cost == null || Number.isNaN(cost)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(cost);
}

/** Renders call metadata summary including duration, timestamp, and booking linkage. */
export function CallMetaPanel({ call, linkedBooking }: CallMetaPanelProps) {
  return (
    <div
      className="rounded-[var(--radius-card)] card-glass p-5"
      style={{ minHeight: '120px' }}
    >
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
        Call details
      </h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[var(--text-muted)]">Duration</dt>
          <dd className="font-medium text-[var(--text-primary)]">
            {formatDuration(call.duration)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Date</dt>
          <dd className="font-medium text-[var(--text-primary)]">
            {formatDate(call.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Status</dt>
          <dd className="font-medium text-[var(--text-primary)] capitalize">
            {call.status ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Escalation</dt>
          <dd className="font-medium text-[var(--text-primary)]">
            {call.escalationFlag ? (
              <span style={{ color: 'var(--warning)' }}>Escalated</span>
            ) : (
              <span className="text-[var(--text-secondary)]">No</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Booking</dt>
          <dd className="font-medium text-[var(--text-primary)]">
            {call.bookingCreated && linkedBooking
              ? `#${linkedBooking.id} — $${linkedBooking.amount}`
              : call.bookingCreated
                ? 'Created'
                : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Call Cost</dt>
          <dd className="font-medium text-[var(--text-primary)]">{formatCost(call.callCost)}</dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Latency</dt>
          <dd className="font-medium text-[var(--text-primary)]">
            {call.latencyE2e != null ? `${Math.round(call.latencyE2e)}ms` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">Disconnection</dt>
          <dd className="font-medium text-[var(--text-primary)]">
            {call.disconnectionReason ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">LLM Tokens</dt>
          <dd className="font-medium text-[var(--text-primary)]">
            {call.llmTokensTotal != null ? Math.round(call.llmTokensTotal).toLocaleString() : '—'}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[var(--text-muted)]">Token Usage (Retell Raw)</dt>
          <dd className="font-medium text-[var(--text-primary)] break-all">
            {call.llmTokenUsage ? JSON.stringify(call.llmTokenUsage) : '—'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
