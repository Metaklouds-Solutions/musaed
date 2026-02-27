/**
 * Reports domain types. Outcomes and performance metrics.
 */

/** Call outcome breakdown for reports. */
export interface OutcomeBreakdown {
  outcome: 'booked' | 'escalated' | 'failed';
  count: number;
  percentage: number;
}

/** Agent performance metrics for reports. */
export interface PerformanceMetrics {
  avgDurationSec: number;
  conversionRate: number;
  escalationRate: number;
  totalCalls: number;
  totalBookings: number;
  sentimentAvg: number;
}
