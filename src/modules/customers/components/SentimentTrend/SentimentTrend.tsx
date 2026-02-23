/**
 * Sentiment trend from calls (by date order). Data from props only.
 */

import type { Call } from '../../../../shared/types';

interface SentimentTrendProps {
  calls: Call[];
}

export function SentimentTrend({ calls }: SentimentTrendProps) {
  if (calls.length === 0) {
    return (
      <div
        className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
        style={{ minHeight: '100px' }}
      >
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
          Sentiment trend
        </h3>
        <p className="text-sm text-[var(--text-muted)]">No call data yet</p>
      </div>
    );
  }
  const sorted = [...calls].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const avg = sorted.reduce((s, c) => s + c.sentimentScore, 0) / sorted.length;
  const pct = Math.round(avg * 100);
  return (
    <div
      className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
      style={{ minHeight: '100px' }}
    >
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
        Sentiment trend
      </h3>
      <p className="text-2xl font-semibold text-[var(--text-primary)]">{pct}%</p>
      <p className="text-sm text-[var(--text-muted)] mt-1">
        Average across {sorted.length} call{sorted.length !== 1 ? 's' : ''}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {sorted.map((c) => (
          <span
            key={c.id}
            className="inline-block w-8 h-2 rounded shrink-0"
            style={{
              background:
                c.sentimentScore >= 0.7
                  ? 'var(--success)'
                  : c.sentimentScore >= 0.4
                    ? 'var(--text-muted)'
                    : 'var(--error)',
            }}
            title={`${new Date(c.createdAt).toLocaleDateString()}: ${Math.round(c.sentimentScore * 100)}%`}
          />
        ))}
      </div>
    </div>
  );
}
