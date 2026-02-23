/**
 * Alerts page (Module 7). Layout only; data and logic in useAlerts and adapter.
 */

import { PageHeader } from '../../../shared/ui';
import { useAlerts } from '../hooks';
import { AlertsList } from '../components/AlertsList';

export function AlertsPage() {
  const { alerts, resolveAlert } = useAlerts();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Credit low, booking drop, and system notifications. Simulated alerts appear every 20 seconds."
      />
      <AlertsList alerts={alerts} onResolve={resolveAlert} />
    </div>
  );
}
