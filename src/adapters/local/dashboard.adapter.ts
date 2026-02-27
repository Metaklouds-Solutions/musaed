/**
 * Local dashboard adapter. Derived metrics from calls/bookings; filters by tenantId.
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
  TenantKpis,
  TenantAgentStatus,
  TenantStaffCounts,
  TenantOpenTicket,
  TenantRecentCall,
} from '../../shared/types';

function filterByTenant<T extends { tenantId: string }>(items: T[], tenantId: string | undefined): T[] {
  if (tenantId == null) return items;
  return items.filter((x) => x.tenantId === tenantId);
}

const COST_PER_MINUTE_HUMAN = 0.15;
const COST_PER_MINUTE_AI = 0.02;

export const dashboardAdapter = {
  getMetrics(tenantId: string | undefined): DashboardMetrics {
    const calls = filterByTenant(seedCalls, tenantId);
    const bookings = filterByTenant(seedBookings, tenantId);
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
  getFunnel(tenantId: string | undefined): FunnelStage[] {
    const calls = filterByTenant(seedCalls, tenantId);
    const bookings = filterByTenant(seedBookings, tenantId);
    const withBooking = calls.filter((c) => c.bookingCreated).length;
    return [
      { stage: 'Calls', count: calls.length },
      { stage: 'Bookings', count: withBooking },
      { stage: 'Confirmed', count: bookings.length },
    ];
  },
  getTrend(tenantId: string | undefined): TrendPoint[] {
    const bookings = filterByTenant(seedBookings, tenantId);
    const byDate = new Map<string, number>();
    for (const b of bookings) {
      const date = b.createdAt.slice(0, 10);
      byDate.set(date, (byDate.get(date) ?? 0) + 1);
    }
    const sorted = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.map(([date, count]) => ({ date, bookings: count }));
  },

  /** Tenant dashboard KPIs. */
  getTenantKpis(tenantId: string | undefined): TenantKpis {
    const calls = filterByTenant(seedCalls, tenantId);
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
  getTenantAgentStatus(tenantId: string | undefined): TenantAgentStatus | null {
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
  getTenantStaffCounts(tenantId: string | undefined): TenantStaffCounts {
    const members = tenantId
      ? seedTenantMemberships.filter((m) => m.tenantId === tenantId && m.status === 'active')
      : [];
    const doctors = members.filter((m) => m.roleSlug === 'doctor').length;
    const receptionists = members.filter((m) => m.roleSlug === 'receptionist').length;
    return { doctors, receptionists, total: members.length };
  },

  /** Open tickets for tenant. */
  getTenantOpenTickets(tenantId: string | undefined, limit = 5): TenantOpenTicket[] {
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
  getTenantRecentCalls(tenantId: string | undefined, limit = 10): TenantRecentCall[] {
    return filterByTenant(seedCalls, tenantId)
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
