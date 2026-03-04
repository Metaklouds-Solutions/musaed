/**
 * Admin dashboard: system health (Retell sync, webhooks).
 */

import { motion } from 'motion/react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { AdminSystemHealthExtended } from '../../../../shared/types';

interface AdminSystemHealthProps {
  health: AdminSystemHealthExtended;
}

type Status = 'ok' | 'degraded' | 'error';

const STATUS_LABELS: Record<Status, string> = {
  ok: 'OK',
  degraded: 'Degraded',
  error: 'Error',
};

function StatusBadge({ status }: { status: Status }) {
  const config: Record<Status, { Icon: typeof CheckCircle; className: string }> = {
    ok: { Icon: CheckCircle, className: 'text-[var(--success)]' },
    degraded: { Icon: AlertTriangle, className: 'text-[var(--warning)]' },
    error: { Icon: XCircle, className: 'text-[var(--error)]' },
  };
  const { Icon, className } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${className}`}>
      <Icon className="w-4 h-4 shrink-0" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Renders overall, integration, and platform service health states. */
export function AdminSystemHealth({ health }: AdminSystemHealthProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="relative overflow-hidden rounded-[var(--radius-card)] card-glass p-5"
    >
      <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-[var(--info)]/10 blur-2xl pointer-events-none" />
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">System Health</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">Overall</h3>
          <div className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5">
            <StatusBadge status={health.status} />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">Integrations</h3>
          <ul className="space-y-2">
            {health.integrations.map((i) => (
              <li key={i.name} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-3 py-2">
                <span className="text-sm text-[var(--text-secondary)]">{i.name}</span>
                <StatusBadge status={i.status} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">Platform</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-secondary)]">Retell</span>
              <StatusBadge status={health.retellSync} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-secondary)]">Webhooks</span>
              <StatusBadge status={health.webhooks} />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
