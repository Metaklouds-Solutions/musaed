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
};
