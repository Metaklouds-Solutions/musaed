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

export function AdminSystemHealth({ health }: AdminSystemHealthProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
    >
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">System Health</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">Overall</h3>
          <StatusBadge status={health.status} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">Integrations</h3>
          <ul className="space-y-2">
            {health.integrations.map((i) => (
              <li key={i.name} className="flex items-center justify-between py-1">
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
