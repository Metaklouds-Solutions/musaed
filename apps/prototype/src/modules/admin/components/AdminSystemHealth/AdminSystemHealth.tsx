/**
 * Admin dashboard: inline health badges (Retell, Webhooks, Uptime).
 */

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { AdminHealth } from '../../../../shared/types';

interface AdminSystemHealthProps {
  health: AdminHealth;
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

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

/** Renders inline health badges: Retell, Webhooks, Uptime. */
export function AdminSystemHealth({ health }: AdminSystemHealthProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--text-muted)]">Retell</span>
        <StatusBadge status={health.retellSync} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--text-muted)]">Webhooks</span>
        <StatusBadge status={health.webhooks} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--text-muted)]">Uptime</span>
        <span className="text-sm font-medium text-[var(--text-primary)]">{formatUptime(health.uptimeSeconds)}</span>
      </div>
    </div>
  );
}
