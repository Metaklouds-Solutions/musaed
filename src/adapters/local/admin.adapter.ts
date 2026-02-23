/**
 * Local admin adapter. Platform-wide metrics from seed; no tenant filter.
 */

import {
  seedTenants,
  seedAgents,
  seedCalls,
  seedBookings,
  seedCredits,
  seedTenantPlans,
  seedCreditsRevenue,
  seedPaymentFailures,
  seedUsageAnomalies,
  seedChurnRisk,
} from '../../mock/seedData';
import type {
  AdminOverviewMetrics,
  AdminTenantRow,
  SystemHealth,
  PaymentFailure,
  PlanDistributionItem,
  UsageAnomaly,
  ChurnRisk,
} from '../../shared/types';

const tenantName = (tenantId: string): string => {
  const t = seedTenants.find((x) => x.id === tenantId);
  return t?.name ?? tenantId;
};

export const adminAdapter = {
  getOverview(): AdminOverviewMetrics {
    const mrr = seedTenantPlans.reduce((s, p) => s + p.mrr, 0);
    const totalRevenue = mrr + seedCreditsRevenue;
    const paymentFailures: PaymentFailure[] = seedPaymentFailures.map((p) => ({
      id: p.id,
      tenantId: p.tenantId,
      tenantName: tenantName(p.tenantId),
      amount: p.amount,
      failedAt: p.failedAt,
    }));
    const planCounts = new Map<string, number>();
    seedTenantPlans.forEach((p) => planCounts.set(p.plan, (planCounts.get(p.plan) ?? 0) + 1));
    const planDistribution: PlanDistributionItem[] = Array.from(planCounts.entries()).map(
      ([plan, count]) => ({ plan, count })
    );

    const aiMinutesUsed = seedCredits.reduce((s, c) => s + c.minutesUsed, 0);
    const platformCallsHandled = seedCalls.length;
    const platformBookingsCreated = seedBookings.length;
    const escalated = seedCalls.filter((c) => c.escalationFlag).length;
    const escalationRate =
      platformCallsHandled > 0 ? (escalated / platformCallsHandled) * 100 : 0;
    const platformConversionRate =
      platformCallsHandled > 0 ? (platformBookingsCreated / platformCallsHandled) * 100 : 0;

    const usageAnomalies: UsageAnomaly[] = seedUsageAnomalies.map((a) => ({
      id: a.id,
      tenantId: a.tenantId,
      tenantName: tenantName(a.tenantId),
      description: a.description,
      severity: a.severity,
      detectedAt: a.detectedAt,
    }));

    const churnRiskList: ChurnRisk[] = seedChurnRisk.map((c) => ({
      tenantId: c.tenantId,
      tenantName: tenantName(c.tenantId),
      reason: c.reason,
      score: c.score,
    }));

    return {
      mrr,
      creditsRevenue: seedCreditsRevenue,
      totalRevenue,
      paymentFailures,
      planDistribution,
      activeTenants: seedTenants.length,
      activeAgents: seedAgents.length,
      aiMinutesUsed,
      platformCallsHandled,
      platformBookingsCreated,
      platformConversionRate,
      escalationRate,
      usageAnomalies,
      churnRiskList,
    };
  },

  getTenants(): AdminTenantRow[] {
    return seedTenants.map((t) => {
      const planRow = seedTenantPlans.find((p) => p.tenantId === t.id);
      return { id: t.id, name: t.name, plan: planRow?.plan ?? '—' };
    });
  },

  getSystemHealth(): SystemHealth {
    return {
      status: 'ok',
      integrations: [
        { name: 'Stripe', status: 'ok' },
        { name: 'AI Provider', status: 'ok' },
        { name: 'Database', status: 'ok' },
      ],
    };
  },
};
