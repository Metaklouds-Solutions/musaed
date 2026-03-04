/**
 * Health dashboard: Retell, DB, API status cards.
 * Shows core platform dependencies for admin monitoring.
 */

import { CheckCircle, AlertTriangle, XCircle, Radio, Database, Server } from 'lucide-react';
import type { SystemHealth } from '../../../../shared/types';

type Status = 'ok' | 'degraded' | 'error';

function isStatus(s: unknown): s is Status {
  return s === 'ok' || s === 'degraded' || s === 'error';
}

const STATUS_CONFIG: Record<Status, { Icon: typeof CheckCircle; label: string; className: string }> = {
  ok: { Icon: CheckCircle, label: 'OK', className: 'text-[var(--success)]' },
  degraded: { Icon: AlertTriangle, label: 'Degraded', className: 'text-[var(--warning)]' },
  error: { Icon: XCircle, label: 'Error', className: 'text-[var(--error)]' },
};

const CORE_SERVICES = [
  { key: 'Retell (Voice API)', icon: Radio, description: 'Voice AI provider' },
  { key: 'Database', icon: Database, description: 'Primary database' },
  { key: 'API (Backend)', icon: Server, description: 'Application API' },
];

interface HealthDashboardSectionProps {
  systemHealth: SystemHealth;
}

function getServiceStatus(
  integrations: SystemHealth['integrations'],
  name: string
): Status {
  const found = integrations.find((i) => i.name === name);
  return isStatus(found?.status) ? found.status : 'ok';
}

export function HealthDashboardSection({ systemHealth }: HealthDashboardSectionProps) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">
        Health dashboard
      </h2>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Core platform services: Retell voice API, database, and backend API.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CORE_SERVICES.map(({ key, icon: Icon, description }) => {
          const status = getServiceStatus(systemHealth.integrations, key);
          const config = STATUS_CONFIG[status];
          return (
            <div
              key={key}
              className="flex items-start gap-3 p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
            >
              <div className="p-2 rounded-lg bg-[var(--bg-subtle)]">
                <Icon size={20} className="text-[var(--text-muted)]" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[var(--text-primary)]">{key}</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${config.className}`}>
                    <config.Icon size={14} aria-hidden />
                    {config.label}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
