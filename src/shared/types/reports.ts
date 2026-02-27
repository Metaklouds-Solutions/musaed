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

/** A/B test comparison: outcomes by agent version. */
export interface ABTestOutcomeRow {
  version: string;
  totalCalls: number;
  booked: number;
  escalated: number;
  failed: number;
  conversionRate: number;
  escalationRate: number;
  avgDurationSec: number;
  sentimentAvg: number;
}
