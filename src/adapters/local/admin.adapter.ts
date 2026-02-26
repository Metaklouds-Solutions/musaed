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
  seedSupportTickets,
  seedTenantExtended,
} from '../../mock/seedData';
import type {
  AdminOverviewMetrics,
  AdminTenantRow,
  AdminKpis,
  AdminRecentTenant,
  AdminSupportSnapshot,
  AdminRecentCall,
  AdminSystemHealthExtended,
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

  /** Admin dashboard: top KPIs. */
  getAdminKpis(): AdminKpis {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const callsToday = seedCalls.filter((c) => c.createdAt >= todayStart).length;
    const calls7d = seedCalls.filter((c) => c.createdAt >= sevenDaysAgo).length;
    const booked = seedCalls.filter((c) => c.bookingCreated).length;
    const escalated = seedCalls.filter((c) => c.escalationFlag).length;
    const totalMinutes = seedCredits.reduce((s, c) => s + c.minutesUsed, 0);
    const totalCostUsd = totalMinutes * 0.02;
    const statusCounts = seedTenantExtended.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return {
      totalTenants: seedTenants.length,
      activeTenants: statusCounts.ACTIVE ?? 0,
      trialTenants: statusCounts.TRIAL ?? 0,
      suspendedTenants: statusCounts.SUSPENDED ?? 0,
      callsToday,
      calls7d,
      bookedPercent: seedCalls.length > 0 ? (booked / seedCalls.length) * 100 : 0,
      escalationPercent: seedCalls.length > 0 ? (escalated / seedCalls.length) * 100 : 0,
      failedPercent: seedCalls.length > 0 ? ((seedCalls.length - booked) / seedCalls.length) * 100 : 0,
      totalCostUsd,
    };
  },

  /** Admin dashboard: recent tenants. */
  getRecentTenants(limit = 5): AdminRecentTenant[] {
    return seedTenantExtended
      .map((ext) => {
        const t = seedTenants.find((x) => x.id === ext.tenantId);
        const planRow = seedTenantPlans.find((p) => p.tenantId === ext.tenantId);
        if (!t) return null;
        return {
          id: t.id,
          name: t.name,
          plan: planRow?.plan ?? '—',
          status: ext.status,
          createdAt: ext.createdAt,
          onboardingProgress: Math.min(100, ext.onboardingStep * 25),
        };
      })
      .filter((x): x is AdminRecentTenant => x !== null)
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .slice(0, limit);
  },

  /** Admin dashboard: support inbox snapshot. */
  getSupportSnapshot(): AdminSupportSnapshot {
    const open = seedSupportTickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
    const critical = seedSupportTickets.filter((t) => t.priority === 'critical').length;
    const now = Date.now();
    const oldest = seedSupportTickets
      .filter((t) => t.status !== 'resolved')
      .map((t) => Math.floor((now - new Date(t.createdAt).getTime()) / (24 * 60 * 60 * 1000)))
      .reduce((a, b) => Math.max(a, b), 0);
    return { openCount: open, criticalCount: critical, oldestWaitingDays: oldest };
  },

  /** Admin dashboard: recent calls (cross-tenant). */
  getRecentCalls(limit = 10): AdminRecentCall[] {
    return seedCalls
      .map((c) => {
        const agent = seedAgents.find((a) => a.tenantId === c.tenantId);
        const outcome: AdminRecentCall['outcome'] = c.bookingCreated ? 'booked' : c.escalationFlag ? 'escalated' : 'failed';
        return {
          id: c.id,
          tenantId: c.tenantId,
          tenantName: tenantName(c.tenantId),
          agentName: agent?.name ?? '—',
          outcome,
          duration: c.duration,
          startedAt: c.createdAt,
        };
      })
      .sort((a, b) => (b.startedAt > a.startedAt ? 1 : -1))
      .slice(0, limit);
  },

  /** Admin dashboard: extended system health (Retell, webhooks). */
  getSystemHealthExtended(): AdminSystemHealthExtended {
    return {
      status: 'ok',
      integrations: [
        { name: 'Stripe', status: 'ok' },
        { name: 'AI Provider', status: 'ok' },
        { name: 'Database', status: 'ok' },
        { name: 'Retell', status: 'ok' },
        { name: 'Webhooks', status: 'ok' },
      ],
      retellSync: 'ok',
      webhooks: 'ok',
    };
  },
};
