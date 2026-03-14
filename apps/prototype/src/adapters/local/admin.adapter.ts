/**
 * Local admin adapter. Platform-wide metrics from seed; no tenant filter.
 */

import { tenantsAdapter } from './tenants.adapter';
import {
  seedTenants,
  seedAgents,
  seedCalls,
  seedBookings,
  seedCredits,
  seedTenantPlans,
  seedSupportTickets,
  seedTenantExtended,
} from '../../mock/seedData';
import type {
  AdminTenantRow,
  AdminPulseKpis,
  AdminHealth,
  AdminRecentTenant,
  AdminSupportSnapshot,
  AdminRecentCall,
  AdminBillingRow,
} from '../../shared/types';

const tenantName = (tenantId: string): string => {
  const t = seedTenants.find((x) => x.id === tenantId);
  return t?.name ?? tenantId;
};

export const adminAdapter = {
  getDashboardSummary() {
    return {
      signal:
        seedTenants.length === 0 && seedCalls.length === 0
          ? { status: 'empty' as const, reason: 'No tenants, calls, or support activity are visible yet.' }
          : { status: 'healthy' as const, reason: 'Tenant, call, and support activity are flowing into the admin dashboard.' },
      health: this.getHealth(),
      kpis: this.getPulseKpis(),
      recentTenants: this.getRecentTenants(5),
      supportSnapshot: this.getSupportSnapshot(),
      recentCalls: this.getRecentCalls(5),
    };
  },

  getHealth(): AdminHealth {
    const uptime =
      typeof process !== 'undefined' && typeof process.uptime === 'function'
        ? process.uptime()
        : 0;
    return {
      retellSync: 'ok',
      webhooks: 'ok',
      uptimeSeconds: Math.round(uptime),
    };
  },

  getPulseKpis(): AdminPulseKpis {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const callsToday = seedCalls.filter((c) => c.createdAt >= todayStart).length;
    const calls7d = seedCalls.filter((c) => c.createdAt >= sevenDaysAgo).length;
    const booked = seedCalls.filter((c) => c.bookingCreated).length;
    const escalated = seedCalls.filter((c) => c.escalationFlag).length;
    const totalMinutes = seedCredits.reduce((s, c) => s + c.minutesUsed, 0);
    const estimatedCostUsd = totalMinutes * 0.02;
    const statusCounts = seedTenantExtended.reduce<Record<string, number>>(
      (acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      },
      {}
    );
    const activeTenants = (statusCounts.ACTIVE ?? 0) + (statusCounts.TRIAL ?? 0);
    return {
      activeTenants,
      activeAgents: seedAgents.length,
      callsToday,
      calls7d,
      bookedPercent: seedCalls.length > 0 ? (booked / seedCalls.length) * 100 : 0,
      escalationPercent: seedCalls.length > 0 ? (escalated / seedCalls.length) * 100 : 0,
      aiMinutesUsed: totalMinutes,
      estimatedCostUsd,
    };
  },

  getTenants(): AdminTenantRow[] {
    return tenantsAdapter.getAllTenants();
  },

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

  getRecentCalls(limit = 5): AdminRecentCall[] {
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

  getBillingOverview(): AdminBillingRow[] {
    const RATE_PER_MINUTE = 0.02;
    return seedTenants.map((t) => {
      const planRow = seedTenantPlans.find((p) => p.tenantId === t.id);
      const credits = seedCredits.find((c) => c.tenantId === t.id);
      const minutesUsed = credits?.minutesUsed ?? 0;
      return {
        tenantId: t.id,
        tenantName: t.name,
        plan: planRow?.plan ?? '—',
        mrr: planRow?.mrr ?? 0,
        minutesUsed,
        creditBalance: credits?.balance ?? 0,
        usageCostUsd: minutesUsed * RATE_PER_MINUTE,
      };
    });
  },
};
