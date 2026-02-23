/**
 * Dashboard domain types. Used by adapters and dashboard module.
 * No revenue-attributed metrics (prototype cannot justify attribution).
 */

export interface DashboardMetrics {
  totalBookings: number;
  conversionRate: number;
  callsHandled: number;
  escalationRate: number;
  costSaved: number;
  aiConfidenceScore: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface TrendPoint {
  date: string;
  bookings: number;
}
