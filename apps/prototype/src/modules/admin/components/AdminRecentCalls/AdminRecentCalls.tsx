/**
 * Admin dashboard: recent calls feed list (stacked, no table).
 */

import { motion } from 'motion/react';
import { PillTag } from '../../../../shared/ui';
import type { AdminRecentCall } from '../../../../shared/types';

interface AdminRecentCallsProps {
  calls: AdminRecentCall[];
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDateTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function OutcomePill({ outcome }: { outcome: AdminRecentCall['outcome'] }) {
  const variant =
    outcome === 'booked'
      ? 'outcomeBooked'
      : outcome === 'escalated'
        ? 'outcomeEscalated'
        : outcome === 'failed'
          ? 'outcomeFailed'
          : 'outcomePending';
  return <PillTag variant={variant}>{outcome}</PillTag>;
}

/** Renders cross-tenant recent calls as stacked feed list. */
export function AdminRecentCalls({ calls }: AdminRecentCallsProps) {
  if (calls.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-[var(--radius-card)] card-glass p-6"
      >
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Calls</h2>
        <p className="text-sm text-[var(--text-muted)]">
          No recent platform calls were returned. In a live environment with active tenants, treat
          this as a signal to verify ingestion rather than a healthy zero.
        </p>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="rounded-[var(--radius-card)] card-glass p-5"
    >
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Calls</h2>
      <ul className="space-y-2">
        {calls.map((c) => (
          <li key={c.id} className="rounded-lg bg-[var(--ds-primary)]/10 px-3 py-3">
            <p className="font-medium text-[var(--text-primary)] truncate">
              {c.tenantName} · {c.agentName}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
              <OutcomePill outcome={c.outcome} />
              <span>{formatDuration(c.duration)}</span>
              <span>·</span>
              <span>{formatDateTime(c.startedAt)}</span>
            </p>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
