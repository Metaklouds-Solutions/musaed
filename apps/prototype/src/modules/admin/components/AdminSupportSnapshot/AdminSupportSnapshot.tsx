/**
 * Admin dashboard: support inbox snapshot (open, critical, oldest).
 */

import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { ViewButton, AnimatedNumber } from '../../../../shared/ui';
import type { AdminSupportSnapshot } from '../../../../shared/types';

interface AdminSupportSnapshotProps {
  snapshot: AdminSupportSnapshot;
}

/** Renders support queue counts and highlights critical waiting tickets. Hidden when queue is empty. */
export function AdminSupportSnapshot({ snapshot }: AdminSupportSnapshotProps) {
  if (snapshot.openCount === 0 && snapshot.criticalCount === 0) {
    return null;
  }
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="relative overflow-hidden rounded-[var(--radius-card)] card-glass p-5"
    >
      <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-[var(--warning)]/10 blur-2xl pointer-events-none" />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Support Inbox Snapshot</h2>
        <ViewButton to="/admin/support">View inbox</ViewButton>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 p-4 transition-all hover:border-[var(--border-default)] hover:shadow-[var(--shadow-elevated)]">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Open Tickets</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]"><AnimatedNumber value={snapshot.openCount} /></p>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 p-4 transition-all hover:border-[var(--border-default)] hover:shadow-[var(--shadow-elevated)]">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Critical</p>
          <p className="mt-1 text-2xl font-bold text-[var(--error)]"><AnimatedNumber value={snapshot.criticalCount} /></p>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/70 p-4 transition-all hover:border-[var(--border-default)] hover:shadow-[var(--shadow-elevated)]">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Oldest Waiting</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]"><AnimatedNumber value={snapshot.oldestWaitingDays} format={(n) => `${n}d`} /></p>
        </div>
      </div>
      {snapshot.criticalCount > 0 && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--warning)]">
          <AlertCircle size={16} aria-hidden />
          <span>{snapshot.criticalCount} critical ticket(s) need attention</span>
        </div>
      )}
      {snapshot.openCount === 0 && snapshot.criticalCount === 0 && (
        <div className="mt-4 text-sm text-[var(--text-muted)]">
          Support queue is clear right now. If the business expects ticket volume, compare this with
          the raw support list to confirm the feed is current.
        </div>
      )}
    </motion.section>
  );
}
