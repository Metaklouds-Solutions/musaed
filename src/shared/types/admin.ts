/**
 * Admin (platform) metrics. Used by admin adapter and admin module only.
 */

export interface TenantPlan {
  tenantId: string;
  plan: string;
  mrr: number;
}

export interface PaymentFailure {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  failedAt: string;
}

export interface PlanDistributionItem {
  plan: string;
  count: number;
}

export interface UsageAnomaly {
  id: string;
  tenantId: string;
  tenantName: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: string;
}

export interface ChurnRisk {
  tenantId: string;
  tenantName: string;
  reason: string;
  score: number;
}

/** Admin tenant row for tenant list page. */
export interface AdminTenantRow {
  id: string;
  name: string;
  plan: string;
}

/** System health for admin system page. */
export interface SystemHealth {
  status: 'ok' | 'degraded' | 'error';
  integrations: { name: string; status: 'ok' | 'degraded' | 'error' }[];
}

export interface AdminOverviewMetrics {
  mrr: number;
  creditsRevenue: number;
  totalRevenue: number;
  paymentFailures: PaymentFailure[];
  planDistribution: PlanDistributionItem[];
  activeTenants: number;
  activeAgents: number;
  aiMinutesUsed: number;
  platformCallsHandled: number;
  platformBookingsCreated: number;
  platformConversionRate: number;
  escalationRate: number;
  usageAnomalies: UsageAnomaly[];
  churnRiskList: ChurnRisk[];
}

/** Admin dashboard top KPIs. */
export interface AdminKpis {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  callsToday: number;
  calls7d: number;
  bookedPercent: number;
  escalationPercent: number;
  failedPercent: number;
  totalCostUsd: number;
}

/** Recent tenant row for admin dashboard. */
export interface AdminRecentTenant {
  id: string;
  name: string;
  plan: string;
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
  createdAt: string;
  onboardingProgress: number;
}

/** Support inbox snapshot for admin dashboard. */
export interface AdminSupportSnapshot {
  openCount: number;
  criticalCount: number;
  oldestWaitingDays: number;
}

/** Recent call row for admin dashboard (cross-tenant). */
export interface AdminRecentCall {
  id: string;
  tenantId: string;
  tenantName: string;
  agentName: string;
  outcome: 'booked' | 'escalated' | 'failed' | 'pending';
  duration: number;
  startedAt: string;
}

/** Extended system health with Retell and webhooks. */
export interface AdminSystemHealthExtended extends SystemHealth {
  retellSync: 'ok' | 'degraded' | 'error';
  webhooks: 'ok' | 'degraded' | 'error';
}
