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
  aiCost?: number;
  avgLatencyMs?: number;
  topDisconnectionReason?: string;
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

/** ROI metrics for dashboard widget. */
export interface RoiMetrics {
  revenue: number;
  aiCost: number;
  costSaved: number;
  roiPercent: number;
  totalMinutes: number;
}

/** Tenant dashboard KPIs. */
export interface TenantKpis {
  callsToday: number;
  calls7d: number;
  appointmentsBooked: number;
  escalations: number;
  missedNoAnswer: number;
  failedCalls: number;
  avgDurationSec: number;
  topOutcome: string;
  minutesUsed: number;
  creditBalance: number;
}

/** Agent status for tenant dashboard. */
export interface TenantAgentStatus {
  voice: string;
  language: string;
  status: 'active' | 'paused';
  lastSyncedAt: string;
}

/** Staff count by role for tenant dashboard. */
export interface TenantStaffCounts {
  doctors: number;
  receptionists: number;
  total: number;
}

/** Open ticket summary for tenant dashboard. */
export interface TenantOpenTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

/** Recent call row for tenant dashboard. */
export interface TenantRecentCall {
  id: string;
  outcome: 'booked' | 'escalated' | 'failed' | 'info_only' | 'unknown';
  duration: number;
  createdAt: string;
}
