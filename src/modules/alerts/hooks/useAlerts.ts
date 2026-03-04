/**
 * Alerts list and actions. Adapter only; tenant-scoped via session.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from '../../../app/session/SessionContext';
import { alertsAdapter } from '../../../adapters';
import type { Alert } from '../../../shared/types';

const SIMULATION_INTERVAL_MS = 20000;

export function useAlerts() {
  const { user } = useSession();
  const tenantId = user?.tenantId;
  const [alerts, setAlerts] = useState<Alert[]>(() =>
    tenantId ? alertsAdapter.getAlerts(tenantId) : []
  );

  const refresh = useCallback(() => {
    setAlerts(tenantId ? alertsAdapter.getAlerts(tenantId) : []);
  }, [tenantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (tenantId == null) return;
    const id = setInterval(() => {
      alertsAdapter.addSimulatedAlert(tenantId);
      setAlerts(alertsAdapter.getAlerts(tenantId));
    }, SIMULATION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [tenantId]);

  const resolveAlert = useCallback(
    (alertId: string) => {
      alertsAdapter.resolveAlert(alertId);
      refresh();
    },
    [refresh]
  );

  return useMemo(
    () => ({ alerts, resolveAlert, tenantId }),
    [alerts, resolveAlert, tenantId]
  );
}
