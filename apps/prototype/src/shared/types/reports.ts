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

/** Tenant comparison row: metrics for one tenant. */
export interface TenantComparisonRow {
  tenantId: string;
  tenantName: string;
  totalCalls: number;
  totalBookings: number;
  totalCustomers?: number;
  conversionRate: number;
  escalationRate: number;
  avgDurationSec: number;
  sentimentAvg: number;
}

/** Time period comparison: current vs previous period. */
export interface PeriodComparison {
  current: number;
  previous: number;
  changePercent: number;
  label: string;
}

/** Sentiment distribution bucket. */
export interface SentimentBucket {
  label: string;
  range: string;
  count: number;
  percentage: number;
}

/** Peak hours: calls per hour (0–23). */
export interface PeakHourPoint {
  hour: number;
  label: string;
  count: number;
}

/** Outcomes by day for trend. */
export interface OutcomesByDay {
  date: string;
  booked: number;
  escalated: number;
  failed: number;
  total: number;
}

/** Intent distribution bucket (derived from transcript keywords). */
export interface IntentBucket {
  label: string;
  count: number;
  percentage: number;
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
