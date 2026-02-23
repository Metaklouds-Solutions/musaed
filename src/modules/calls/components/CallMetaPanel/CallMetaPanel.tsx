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
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function CallMetaPanel({ call, linkedBooking }: CallMetaPanelProps) {
  return (
    <div
      className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
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
      </dl>
    </div>
  );
}
