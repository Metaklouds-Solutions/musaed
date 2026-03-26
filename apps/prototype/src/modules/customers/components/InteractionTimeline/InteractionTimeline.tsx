/**
 * Interaction timeline: merged calls + bookings by date. Data from props only.
 */

import { Link } from 'react-router-dom';

export interface TimelineItem {
  date: string;
  type: 'call' | 'booking';
  id: string;
  label: string;
}

interface InteractionTimelineProps {
  items: TimelineItem[];
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

export function InteractionTimeline({ items }: InteractionTimelineProps) {
  if (items.length === 0) {
    return (
      <div
        className="rounded-[var(--radius-card)] card p-5"
        style={{ minHeight: '100px' }}
      >
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
          Interaction timeline
        </h3>
        <p className="text-sm text-[var(--text-muted)]">No interactions yet</p>
      </div>
    );
  }
  return (
    <div
      className="rounded-[var(--radius-card)] card p-5"
      style={{ minHeight: '100px' }}
    >
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
        Interaction timeline
      </h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={`${item.type}-${item.id}`}
            className="flex items-center gap-3 text-sm"
          >
            <span className="text-[var(--text-muted)] shrink-0 w-36">
              {formatDate(item.date)}
            </span>
            {item.type === 'call' ? (
              <Link
                to={`/calls/${item.id}`}
                className="text-[var(--primary)] hover:underline font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--text-primary)]">{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
