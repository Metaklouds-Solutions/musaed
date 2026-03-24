/**
 * Follow-up indicator. Data from props only.
 */

import { AlertCircle } from 'lucide-react';

interface FollowUpIndicatorProps {
  recommended: boolean;
  lastContactDate?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function FollowUpIndicator({ recommended, lastContactDate }: FollowUpIndicatorProps) {
  return (
    <div
      className="rounded-[var(--radius-card)] card p-5"
      style={{ minHeight: '80px' }}
    >
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
        Follow-up
      </h3>
      {lastContactDate && (
        <p className="text-sm text-[var(--text-muted)]">
          Last contact: {formatDate(lastContactDate)}
        </p>
      )}
      {recommended ? (
        <div
          className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
          style={{
            background: 'rgba(234, 179, 8, 0.1)',
            color: 'var(--warning)',
          }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          Follow-up recommended
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)] mt-1">No follow-up needed</p>
      )}
    </div>
  );
}
