/**
 * Local reports adapter. Outcomes and performance from calls/bookings.
 */

import { seedCalls, seedBookings } from '../../mock/seedData';
import type { OutcomeBreakdown, PerformanceMetrics } from '../../shared/types/reports';

function filterByTenant<T extends { tenantId: string }>(items: T[], tenantId: string | undefined): T[] {
  if (tenantId == null) return items;
  return items.filter((x) => x.tenantId === tenantId);
}

export const reportsAdapter = {
  /** Outcome breakdown: booked / escalated / failed. */
  getOutcomes(tenantId: string | undefined): OutcomeBreakdown[] {
    const calls = filterByTenant(seedCalls, tenantId);
    const total = calls.length;
    if (total === 0) {
      return [
        { outcome: 'booked', count: 0, percentage: 0 },
        { outcome: 'escalated', count: 0, percentage: 0 },
        { outcome: 'failed', count: 0, percentage: 0 },
      ];
    }
    const booked = calls.filter((c) => c.bookingCreated).length;
    const escalated = calls.filter((c) => c.escalationFlag && !c.bookingCreated).length;
    const failed = total - booked - escalated;
    return [
      { outcome: 'booked', count: booked, percentage: Math.round((booked / total) * 100) },
      { outcome: 'escalated', count: escalated, percentage: Math.round((escalated / total) * 100) },
      { outcome: 'failed', count: failed, percentage: Math.round((failed / total) * 100) },
    ];
  },

  /** Agent performance metrics. */
  getPerformance(tenantId: string | undefined): PerformanceMetrics {
    const calls = filterByTenant(seedCalls, tenantId);
    const bookings = filterByTenant(seedBookings, tenantId);
    const totalCalls = calls.length;
    const totalBookings = bookings.length;
    const booked = calls.filter((c) => c.bookingCreated).length;
    const escalated = calls.filter((c) => c.escalationFlag).length;
    const totalDuration = calls.reduce((s, c) => s + c.duration, 0);
    const totalSentiment = calls.reduce((s, c) => s + c.sentimentScore, 0);

    return {
      totalCalls,
      totalBookings,
      avgDurationSec: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
      conversionRate: totalCalls > 0 ? Math.round((booked / totalCalls) * 100) : 0,
      escalationRate: totalCalls > 0 ? Math.round((escalated / totalCalls) * 100) : 0,
      sentimentAvg: totalCalls > 0 ? Math.round(totalSentiment / totalCalls * 100) / 100 : 0,
    };
  },
};
