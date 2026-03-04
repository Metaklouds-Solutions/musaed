/**
 * Local billing adapter. Credits and plan by tenantId. Minutes from call usage (simulated deduction).
 */

import { seedCredits, seedCalls, seedTenantPlans } from '../../mock/seedData';
import type { BillingOverview } from '../../shared/types';

const COST_PER_MINUTE_HUMAN = 0.15;
const COST_PER_MINUTE_AI = 0.02;

/** Mock overlay: extra balance from "Buy Credits" (persists in session). */
const purchasedBalanceByTenant = new Map<string, number>();

function filterByTenant<T extends { tenantId: string }>(items: T[], tenantId: string | undefined): T[] {
  if (tenantId == null) return items;
  return items.filter((x) => x.tenantId === tenantId);
}

export const billingAdapter = {
  getBillingOverview(tenantId: string | undefined): BillingOverview | undefined {
    if (tenantId == null) return undefined;
    const credits = seedCredits.find((c) => c.tenantId === tenantId);
    const planRow = seedTenantPlans.find((p) => p.tenantId === tenantId);
    const calls = filterByTenant(seedCalls, tenantId);
    const minutesUsed = calls.reduce((s, c) => s + c.duration / 60, 0);
    const baseBalance = credits?.balance ?? 0;
    const purchased = purchasedBalanceByTenant.get(tenantId) ?? 0;
    const creditBalance = baseBalance + purchased;
    const estimatedSavings = minutesUsed * (COST_PER_MINUTE_HUMAN - COST_PER_MINUTE_AI);
    const aiCost = minutesUsed * COST_PER_MINUTE_AI;
    const netROI = aiCost > 0 ? (estimatedSavings / aiCost) * 100 : 0;

    return {
      plan: planRow?.plan ?? '—',
      minutesUsed: Math.round(minutesUsed * 10) / 10,
      creditBalance,
      estimatedSavings: Math.round(estimatedSavings * 100) / 100,
      netROI: Math.round(netROI),
    };
  },

  buyCredits(tenantId: string | undefined): void {
    if (tenantId == null) return;
    const current = purchasedBalanceByTenant.get(tenantId) ?? 0;
    purchasedBalanceByTenant.set(tenantId, current + 500);
  },
};
