/**
 * Admin dashboard: support inbox snapshot (open, critical, oldest).
 */

import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import type { AdminSupportSnapshot } from '../../../../shared/types';

interface AdminSupportSnapshotProps {
  snapshot: AdminSupportSnapshot;
}

export function AdminSupportSnapshot({ snapshot }: AdminSupportSnapshotProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-[var(--radius-card)] card-glass p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Support Inbox Snapshot</h2>
        <Link
          to="/admin/support"
          className="text-sm font-medium text-[var(--ds-primary)] hover:underline"
        >
          View inbox
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-[var(--bg-elevated)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Open Tickets</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{snapshot.openCount}</p>
        </div>
        <div className="rounded-lg bg-[var(--bg-elevated)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Critical</p>
          <p className="mt-1 text-2xl font-bold text-[var(--error)]">{snapshot.criticalCount}</p>
        </div>
        <div className="rounded-lg bg-[var(--bg-elevated)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Oldest Waiting</p>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{snapshot.oldestWaitingDays}d</p>
        </div>
      </div>
      {snapshot.criticalCount > 0 && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--warning)]">
          <AlertCircle size={16} aria-hidden />
          <span>{snapshot.criticalCount} critical ticket(s) need attention</span>
        </div>
      )}
    </motion.section>
  );
}
