/**
 * Local dashboard adapter. Derived metrics from calls/bookings; filters by tenantId.
 * Optional dateRange filters by createdAt.
 */

import {
  seedCalls,
  seedBookings,
  seedCredits,
  seedVoiceAgents,
  seedTenantMemberships,
  seedSupportTickets,
} from '../../mock/seedData';
import type {
  DashboardMetrics,
  FunnelStage,
  TrendPoint,
  RoiMetrics,
  TenantKpis,
  TenantAgentStatus,
  TenantStaffCounts,
  TenantOpenTicket,
  TenantRecentCall,
} from '../../shared/types';

export interface DateRangeFilter {
  start: Date;
  end: Date;
}

function filterByTenant<T extends { tenantId: string }>(items: T[], tenantId: string | undefined): T[] {
  if (tenantId == null) return items;
  return items.filter((x) => x.tenantId === tenantId);
}

function filterByDateRange<T extends { createdAt: string }>(items: T[], range?: DateRangeFilter): T[] {
  if (!range) return items;
  const startMs = range.start.getTime();
  const endMs = range.end.getTime() + 86400000;
  return items.filter((c) => {
    const ms = new Date(c.createdAt).getTime();
    return ms >= startMs && ms < endMs;
  });
}

const COST_PER_MINUTE_HUMAN = 0.15;
const COST_PER_MINUTE_AI = 0.02;

export const dashboardAdapter = {
  async getSummary(tenantId: string | undefined, dateRange?: DateRangeFilter) {
    const [metrics, kpis] = await Promise.all([
      this.getMetrics(tenantId, dateRange),
      this.getTenantKpis(tenantId, dateRange),
    ]);
    return {
      metrics,
      kpis,
      signal:
        kpis.calls7d === 0 && kpis.appointmentsBooked === 0
          ? { status: 'empty' as const, reason: 'No calls or bookings were recorded in the selected range.' }
          : { status: 'healthy' as const, reason: 'Calls and bookings are flowing into the dashboard.' },
    };
  },

  async getMetrics(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<DashboardMetrics> {
    const calls = filterByDateRange(filterByTenant(seedCalls, tenantId), dateRange);
    const bookings = filterByDateRange(filterByTenant(seedBookings, tenantId), dateRange);
    const totalCalls = calls.length;
    const totalMinutes = calls.reduce((s, c) => s + c.duration / 60, 0);
    const totalBookings = bookings.length;
    const callsWithBooking = calls.filter((c) => c.bookingCreated).length;
    const conversionRate = totalCalls > 0 ? (callsWithBooking / totalCalls) * 100 : 0;
    const costSaved = totalMinutes * (COST_PER_MINUTE_HUMAN - COST_PER_MINUTE_AI);
    const escalated = calls.filter((c) => c.escalationFlag).length;
    const escalationRate = totalCalls > 0 ? (escalated / totalCalls) * 100 : 0;
    const avgSentiment = totalCalls > 0 ? calls.reduce((s, c) => s + c.sentimentScore, 0) / totalCalls : 0;
    const aiConfidenceScore = Math.round(avgSentiment * 100);

    return {
      totalBookings,
      conversionRate,
      callsHandled: totalCalls,
      escalationRate,
      costSaved,
      aiConfidenceScore,
    };
  },
  async getFunnel(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<FunnelStage[]> {
    const calls = filterByDateRange(filterByTenant(seedCalls, tenantId), dateRange);
    const bookings = filterByDateRange(filterByTenant(seedBookings, tenantId), dateRange);
    const withBooking = calls.filter((c) => c.bookingCreated).length;
    return [
      { stage: 'Calls', count: calls.length },
      { stage: 'Bookings', count: withBooking },
      { stage: 'Confirmed', count: bookings.length },
    ];
  },
  async getTrend(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<TrendPoint[]> {
    const bookings = filterByDateRange(filterByTenant(seedBookings, tenantId), dateRange);
    const byDate = new Map<string, number>();
    for (const b of bookings) {
      const date = b.createdAt.slice(0, 10);
      byDate.set(date, (byDate.get(date) ?? 0) + 1);
    }
    const sorted = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.map(([date, count]) => ({ date, bookings: count }));
  },

  /** ROI metrics: revenue from bookings, AI cost, cost saved, ROI %. */
  async getRoiMetrics(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<RoiMetrics> {
    const calls = filterByDateRange(filterByTenant(seedCalls, tenantId), dateRange);
    const bookings = filterByDateRange(filterByTenant(seedBookings, tenantId), dateRange);
    const totalMinutes = calls.reduce((s, c) => s + c.duration / 60, 0);
    const revenue = bookings.reduce((s, b) => s + b.amount, 0);
    const aiCost = totalMinutes * COST_PER_MINUTE_AI;
    const costSaved = totalMinutes * (COST_PER_MINUTE_HUMAN - COST_PER_MINUTE_AI);
    const roiPercent = aiCost > 0 ? Math.round(((revenue - aiCost) / aiCost) * 100) : 0;

    return {
      revenue,
      aiCost,
      costSaved,
      roiPercent,
      totalMinutes,
    };
  },

  /** Tenant dashboard KPIs. */
  async getTenantKpis(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<TenantKpis> {
    const calls = filterByDateRange(filterByTenant(seedCalls, tenantId), dateRange);
    const credits = tenantId ? seedCredits.find((c) => c.tenantId === tenantId) : null;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const callsToday = calls.filter((c) => c.createdAt >= todayStart).length;
    const calls7d = calls.filter((c) => c.createdAt >= sevenDaysAgo).length;
    const booked = calls.filter((c) => c.bookingCreated).length;
    const escalated = calls.filter((c) => c.escalationFlag).length;
    const failed = calls.filter((c) => !c.bookingCreated && !c.escalationFlag).length;
    const totalDuration = calls.reduce((s, c) => s + c.duration, 0);
    const avgDuration = calls.length > 0 ? Math.round(totalDuration / calls.length) : 0;
    const outcomes = { booked, escalated, failed };
    const topOutcome = outcomes.booked >= outcomes.escalated && outcomes.booked >= outcomes.failed
      ? 'Booked'
      : outcomes.escalated >= outcomes.failed
        ? 'Escalated'
        : 'Failed';
    const minutesUsed = credits?.minutesUsed ?? 0;
    const creditBalance = credits?.balance ?? 0;
    return {
      callsToday,
      calls7d,
      appointmentsBooked: booked,
      escalations: escalated,
      missedNoAnswer: 0,
      failedCalls: failed,
      avgDurationSec: avgDuration,
      topOutcome,
      minutesUsed,
      creditBalance,
    };
  },

  /** Agent status for tenant. */
  async getTenantAgentStatus(tenantId: string | undefined): Promise<TenantAgentStatus | null> {
    if (!tenantId) return null;
    const va = seedVoiceAgents.find((a) => a.tenantId === tenantId);
    if (!va) return null;
    return {
      voice: va.voice,
      language: va.language,
      status: va.status === 'active' ? 'active' : 'paused',
      lastSyncedAt: va.lastSyncedAt,
    };
  },

  /** Staff counts by role for tenant. */
  async getTenantStaffCounts(tenantId: string | undefined): Promise<TenantStaffCounts> {
    const members = tenantId
      ? seedTenantMemberships.filter((m) => m.tenantId === tenantId && m.status === 'active')
      : [];
    const doctors = members.filter((m) => m.roleSlug === 'doctor').length;
    const receptionists = members.filter((m) => m.roleSlug === 'receptionist').length;
    return { doctors, receptionists, total: members.length };
  },

  /** Open tickets for tenant. */
  async getTenantOpenTickets(tenantId: string | undefined, limit = 5): Promise<TenantOpenTicket[]> {
    const tickets = filterByTenant(seedSupportTickets, tenantId)
      .filter((t) => t.status !== 'resolved')
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .slice(0, limit);
    return tickets.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt,
    }));
  },

  /** Recent calls for tenant. */
  async getTenantRecentCalls(tenantId: string | undefined, limit = 10, dateRange?: DateRangeFilter): Promise<TenantRecentCall[]> {
    return filterByDateRange(filterByTenant(seedCalls, tenantId), dateRange)
      .map((c) => ({
        id: c.id,
        outcome: (c.bookingCreated ? 'booked' : c.escalationFlag ? 'escalated' : 'failed') as TenantRecentCall['outcome'],
        duration: c.duration,
        createdAt: c.createdAt,
      }))
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .slice(0, limit);
  },
};
