/**
 * Alerts page (Module 7). Layout only; data and logic in useAlerts and adapter.
 */

import { PageHeader, TableSkeleton } from '../../../shared/ui';
import { useAlerts } from '../hooks';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { AlertsList } from '../components/AlertsList';

export function AlertsPage() {
  const ready = useDelayedReady();
  const { alerts, resolveAlert } = useAlerts();

  if (!ready) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Alerts"
          description="Credit low, booking drop, and system notifications."
        />
        <TableSkeleton rows={4} cols={4} />
      </div>
    );
  }

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
