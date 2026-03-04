/**
 * Run events debug console. Step-by-step execution log.
 */

import type { RunEvent } from '../../../../shared/types/entities';

interface RunEventsViewerProps {
  events: RunEvent[];
}

function formatTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  }).format(parsed);
}

export function RunEventsViewer({ events }: RunEventsViewerProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-8 text-center">
        No events for this run.
      </p>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
        <span className="text-xs font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Event Log
        </span>
      </div>
      <div className="divide-y divide-[var(--border-subtle)] max-h-[400px] overflow-y-auto">
        {events.map((e) => (
          <div
            key={e.id}
            className="px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {formatTimestamp(e.timestamp)}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--ds-primary)]/10 text-[var(--ds-primary)]">
                {e.eventType}
              </span>
            </div>
            <pre className="text-xs font-mono text-[var(--text-secondary)] whitespace-pre-wrap break-words bg-[var(--bg-base)] rounded p-2 border border-[var(--border-subtle)]">
              {JSON.stringify(e.payload, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
