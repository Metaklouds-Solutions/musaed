/**
 * Local alerts adapter. Filters by tenantId for tenant isolation.
 * Supports resolve and simulated alert generation (every 20s from UI).
 */

import { seedAlerts } from '../../mock/seedData';
import type { Alert } from '../../shared/types';

const resolvedIds = new Set<string>();
const simulatedAlerts: Alert[] = [];
let simCounter = 0;

function filterByTenant<T extends { tenantId: string }>(items: T[], tenantId: string | undefined): T[] {
  if (tenantId == null) return items;
  return items.filter((x) => x.tenantId === tenantId);
}

function withResolved(alert: Alert): Alert {
  return { ...alert, resolved: resolvedIds.has(alert.id) || alert.resolved };
}

/** Alternates credit_low and booking_drop for simulated alerts. */
function createSimulatedAlert(tenantId: string): Alert {
  simCounter += 1;
  const isCredit = simCounter % 2 === 1;
  const id = `sim_${Date.now()}_${simCounter}`;
  const now = new Date().toISOString();
  if (isCredit) {
    return {
      id,
      tenantId,
      severity: 'medium',
      title: 'Credit balance low',
      message: 'Credits running low. Consider topping up.',
      resolved: false,
      createdAt: now,
    };
  }
  return {
    id,
    tenantId,
    severity: 'high',
    title: 'Booking drop',
    message: 'Unusual drop in booking conversion in last 24h.',
    resolved: false,
    createdAt: now,
  };
}

export const alertsAdapter = {
  getAlerts(tenantId: string | undefined): Alert[] {
    const base = filterByTenant(seedAlerts, tenantId).map(withResolved);
    const sim = filterByTenant(simulatedAlerts, tenantId);
    const combined = [...base, ...sim];
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return combined;
  },

  resolveAlert(alertId: string): void {
    resolvedIds.add(alertId);
  },

  addSimulatedAlert(tenantId: string | undefined): void {
    if (tenantId == null) return;
    simulatedAlerts.push(createSimulatedAlert(tenantId));
  },
};
