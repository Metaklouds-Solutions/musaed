/**
 * Admin system health (Module 9). Layout only; data from useAdminSystem (adapter).
 * Maintenance mode: admin can enable banner for all users.
 */

import { useState, useEffect } from 'react';
import { PageHeader, Button } from '../../../shared/ui';
import { useAdminSystem } from '../hooks';
import { HealthDashboardSection } from '../components/HealthDashboardSection';
import { maintenanceAdapter, MAINTENANCE_CHANGED } from '../../../adapters';
import { CheckCircle, AlertTriangle, XCircle, Wrench } from 'lucide-react';

function StatusBadge({ status }: { status: 'ok' | 'degraded' | 'error' }) {
  const config = {
    ok: { Icon: CheckCircle, label: 'OK', className: 'text-[var(--success)]' },
    degraded: { Icon: AlertTriangle, label: 'Degraded', className: 'text-[var(--warning)]' },
    error: { Icon: XCircle, label: 'Error', className: 'text-[var(--error)]' },
  };
  const { Icon, label, className } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${className}`}>
      <Icon className="w-4 h-4 shrink-0" aria-hidden />
      {label}
    </span>
  );
}

export function AdminSystemPage() {
  const { systemHealth } = useAdminSystem();
  const [maintenance, setMaintenance] = useState(() => maintenanceAdapter.getStatus());

  useEffect(() => {
    const handler = () => setMaintenance(maintenanceAdapter.getStatus());
    window.addEventListener(MAINTENANCE_CHANGED, handler);
    return () => window.removeEventListener(MAINTENANCE_CHANGED, handler);
  }, []);

  const handleToggleMaintenance = () => {
    maintenanceAdapter.setEnabled(!maintenance.enabled);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System health"
        description="API status and integrations"
      />
      <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Maintenance mode</h2>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            When enabled, a banner is shown to all users. Use during deployments or planned outages.
          </p>
          <Button
            variant={maintenance.enabled ? 'danger' : 'secondary'}
            className="cursor-pointer flex items-center gap-2"
            onClick={handleToggleMaintenance}
          >
            <Wrench size={16} />
            {maintenance.enabled ? 'Disable maintenance mode' : 'Enable maintenance mode'}
          </Button>
        </div>
      </section>
      <HealthDashboardSection systemHealth={systemHealth} />
      <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">Overall status</h2>
          <StatusBadge status={systemHealth.status} />
        </div>
        {systemHealth.integrations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Integrations</h3>
            <ul className="space-y-2">
              {systemHealth.integrations.map((i) => (
                <li key={i.name} className="flex items-center justify-between py-1">
                  <span className="text-sm text-[var(--text-secondary)]">{i.name}</span>
                  <StatusBadge status={i.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
