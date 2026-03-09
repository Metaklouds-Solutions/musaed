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
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const refresh = useCallback(() => {
    if (!tenantId) {
      setAlerts([]);
      return;
    }
    const result = alertsAdapter.getAlerts(tenantId);
    if (result instanceof Promise) {
      result.then(setAlerts).catch(() => setAlerts([]));
    } else {
      setAlerts(result);
    }
  }, [tenantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (tenantId == null) return;
    const id = setInterval(() => {
      alertsAdapter.addSimulatedAlert(tenantId);
      refresh();
    }, SIMULATION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [tenantId, refresh]);

  const resolveAlert = useCallback(
    async (alertId: string) => {
      const result = alertsAdapter.resolveAlert(alertId);
      if (result instanceof Promise) await result;
      refresh();
    },
    [refresh]
  );

  return useMemo(
    () => ({ alerts, resolveAlert, tenantId }),
    [alerts, resolveAlert, tenantId]
  );
}
