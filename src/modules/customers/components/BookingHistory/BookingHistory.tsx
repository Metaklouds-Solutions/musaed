/**
 * Booking history for a customer. Data from props only.
 */

import { Link } from 'react-router-dom';
import type { Booking } from '../../../../shared/types';

interface BookingHistoryProps {
  bookings: Booking[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BookingHistory({ bookings }: BookingHistoryProps) {
  if (bookings.length === 0) {
    return (
      <div
        className="rounded-[var(--radius-card)] card-glass p-5"
        style={{ minHeight: '100px' }}
      >
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
          Booking history
        </h3>
        <p className="text-sm text-[var(--text-muted)]">No bookings yet</p>
      </div>
    );
  }
  return (
    <div
      className="rounded-[var(--radius-card)] card-glass p-5"
      style={{ minHeight: '100px' }}
    >
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
        Booking history
      </h3>
      <ul className="space-y-2 text-sm">
        {bookings.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-2">
            <span className="text-[var(--text-primary)]">{b.id}</span>
            <span className="text-[var(--text-muted)]">{formatDate(b.createdAt)}</span>
            {b.callId ? (
              <Link
                to={`/calls/${b.callId}`}
                className="text-[var(--primary)] hover:underline shrink-0"
              >
                View call
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
