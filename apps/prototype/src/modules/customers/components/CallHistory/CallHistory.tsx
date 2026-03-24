/**
 * Call history for a customer. Data from props only.
 */

import { Link } from 'react-router-dom';
import { SentimentBadge } from '../../../calls';
import type { Call } from '../../../../shared/types';

interface CallHistoryProps {
  calls: Call[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CallHistory({ calls }: CallHistoryProps) {
  if (calls.length === 0) {
    return (
      <div
        className="rounded-[var(--radius-card)] card p-5"
        style={{ minHeight: '100px' }}
      >
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
          Call history
        </h3>
        <p className="text-sm text-[var(--text-muted)]">No calls yet</p>
      </div>
    );
  }
  return (
    <div
      className="rounded-[var(--radius-card)] card p-5"
      style={{ minHeight: '100px' }}
    >
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
        Call history
      </h3>
      <ul className="space-y-3 text-sm">
        {calls.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-2">
            <Link
              to={`/calls/${c.id}`}
              className="text-[var(--primary)] hover:underline font-medium"
            >
              {formatDate(c.createdAt)} — {formatDuration(c.duration)}
            </Link>
            <SentimentBadge score={c.sentimentScore} />
            {c.escalationFlag && (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: 'rgba(234, 179, 8, 0.1)',
                  color: 'var(--warning)',
                }}
              >
                Escalated
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
