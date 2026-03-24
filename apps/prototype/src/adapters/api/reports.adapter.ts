/**
 * API reports adapter. Fetches performance reports from backend.
 */

import { api } from '../../lib/apiClient';
import type {
  OutcomeBreakdown,
  PerformanceMetrics,
  ABTestOutcomeRow,
  TenantComparisonRow,
  SentimentBucket,
  PeakHourPoint,
  OutcomesByDay,
  IntentBucket,
} from '../../shared/types/reports';

interface DateRangeFilter { start: Date; end: Date }

export interface ScheduledReportConfig {
  enabled: boolean;
  frequency: 'weekly' | 'monthly';
  recipients: string[];
  dayOfWeek?: number;
  dayOfMonth?: number;
}

const defaultPerformance: PerformanceMetrics = {
  totalCalls: 0, totalBookings: 0, avgDurationSec: 0,
  conversionRate: 0, escalationRate: 0, sentimentAvg: 0,
};

export const reportsAdapter = {
  async getOutcomes(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<OutcomeBreakdown[]> {
    if (!tenantId) return [];
    try {
      const params = new URLSearchParams();
      if (dateRange?.start) params.set('dateFrom', dateRange.start.toISOString().slice(0, 10));
      if (dateRange?.end) params.set('dateTo', dateRange.end.toISOString().slice(0, 10));
      const data = await api.get<{
        callMetrics?: { totalCalls?: number; outcomes?: Record<string, number> };
      }>(`/tenant/reports/performance?${params.toString()}`);
      const outcomes = data.callMetrics?.outcomes ?? {};
      const total = data.callMetrics?.totalCalls ?? 0;
      const booked = outcomes.booked ?? 0;
      const escalated = outcomes.escalated ?? 0;
      const failed = outcomes.failed ?? 0;
      const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
      return [
        { outcome: 'booked', count: booked, percentage: pct(booked) },
        { outcome: 'escalated', count: escalated, percentage: pct(escalated) },
        { outcome: 'failed', count: failed, percentage: pct(failed) },
      ];
    } catch {
      return [
        { outcome: 'booked', count: 0, percentage: 0 },
        { outcome: 'escalated', count: 0, percentage: 0 },
        { outcome: 'failed', count: 0, percentage: 0 },
      ];
    }
  },

  async getPerformance(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<PerformanceMetrics> {
    if (!tenantId) return defaultPerformance;
    try {
      const params = new URLSearchParams();
      if (dateRange?.start) params.set('dateFrom', dateRange.start.toISOString().slice(0, 10));
      if (dateRange?.end) params.set('dateTo', dateRange.end.toISOString().slice(0, 10));
      const data = await api.get<{
        totalBookings?: number;
        callMetrics?: { totalCalls?: number; outcomes?: Record<string, number>; avgDurationMs?: number };
      }>(`/tenant/reports/performance?${params.toString()}`);
      const cm = data.callMetrics ?? {};
      const totalCalls = cm.totalCalls ?? 0;
      const outcomes = cm.outcomes ?? {};
      const booked = outcomes.booked ?? 0;
      const escalated = outcomes.escalated ?? 0;
      const conversionRate = totalCalls > 0 ? (booked / totalCalls) * 100 : 0;
      const escalationRate = totalCalls > 0 ? (escalated / totalCalls) * 100 : 0;
      return {
        totalCalls,
        // Keep bookings metric consistent with conversion/outcomes source.
        totalBookings: booked,
        avgDurationSec: (cm.avgDurationMs ?? 0) / 1000,
        conversionRate,
        escalationRate,
        sentimentAvg: 0,
      };
    } catch {
      return defaultPerformance;
    }
  },

  async getScheduledReportConfig(): Promise<ScheduledReportConfig> {
    try {
      const data = await api.get<ScheduledReportConfig>('/admin/settings/scheduled-reports');
      return {
        enabled: data.enabled ?? false,
        frequency: data.frequency ?? 'weekly',
        recipients: data.recipients ?? [],
        dayOfWeek: data.dayOfWeek ?? 1,
        dayOfMonth: data.dayOfMonth ?? 1,
      };
    } catch {
      return { enabled: false, frequency: 'weekly', recipients: [], dayOfWeek: 1, dayOfMonth: 1 };
    }
  },

  async setScheduledReportConfig(config: ScheduledReportConfig): Promise<void> {
    await api.patch('/admin/settings/scheduled-reports', config);
  },

  async getOutcomesByVersion(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<ABTestOutcomeRow[]> {
    if (!tenantId) return [];
    try {
      const params = new URLSearchParams();
      if (dateRange?.start) params.set('dateFrom', dateRange.start.toISOString().slice(0, 10));
      if (dateRange?.end) params.set('dateTo', dateRange.end.toISOString().slice(0, 10));
      const data = await api.get<ABTestOutcomeRow[]>(`/tenant/reports/outcomes-by-version?${params.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getPerformanceForPeriod(
    tenantId: string | undefined,
    period: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth',
  ): Promise<PerformanceMetrics> {
    if (!tenantId) return defaultPerformance;
    try {
      const data = await api.get<PerformanceMetrics>(`/tenant/reports/performance-for-period?period=${period}`);
      return {
        totalCalls: data.totalCalls ?? 0,
        totalBookings: data.totalBookings ?? 0,
        avgDurationSec: data.avgDurationSec ?? 0,
        conversionRate: data.conversionRate ?? 0,
        escalationRate: data.escalationRate ?? 0,
        sentimentAvg: data.sentimentAvg ?? 0,
      };
    } catch {
      return defaultPerformance;
    }
  },

  async getSentimentDistribution(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<SentimentBucket[]> {
    if (!tenantId) return [];
    try {
      const params = new URLSearchParams();
      if (dateRange?.start) params.set('dateFrom', dateRange.start.toISOString().slice(0, 10));
      if (dateRange?.end) params.set('dateTo', dateRange.end.toISOString().slice(0, 10));
      const data = await api.get<SentimentBucket[]>(`/tenant/reports/sentiment-distribution?${params.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getPeakHours(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<PeakHourPoint[]> {
    if (!tenantId) return [];
    try {
      const params = new URLSearchParams();
      if (dateRange?.start) params.set('dateFrom', dateRange.start.toISOString().slice(0, 10));
      if (dateRange?.end) params.set('dateTo', dateRange.end.toISOString().slice(0, 10));
      const data = await api.get<PeakHourPoint[]>(`/tenant/reports/peak-hours?${params.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getIntentDistribution(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<IntentBucket[]> {
    if (!tenantId) return [];
    try {
      const params = new URLSearchParams();
      if (dateRange?.start) params.set('dateFrom', dateRange.start.toISOString().slice(0, 10));
      if (dateRange?.end) params.set('dateTo', dateRange.end.toISOString().slice(0, 10));
      const data = await api.get<IntentBucket[]>(`/tenant/reports/intent-distribution?${params.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getOutcomesByDay(tenantId: string | undefined, dateRange?: DateRangeFilter): Promise<OutcomesByDay[]> {
    if (!tenantId) return [];
    try {
      const params = new URLSearchParams();
      if (dateRange?.start) params.set('dateFrom', dateRange.start.toISOString().slice(0, 10));
      if (dateRange?.end) params.set('dateTo', dateRange.end.toISOString().slice(0, 10));
      const data = await api.get<OutcomesByDay[]>(`/tenant/reports/outcomes-by-day?${params.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getTenantComparison(tenantIds: string[], dateRange?: DateRangeFilter): Promise<TenantComparisonRow[]> {
    if (tenantIds.length === 0) return [];
    try {
      const params = new URLSearchParams({ tenantIds: tenantIds.join(',') });
      if (dateRange?.start) params.set('dateFrom', dateRange.start.toISOString().slice(0, 10));
      if (dateRange?.end) params.set('dateTo', dateRange.end.toISOString().slice(0, 10));
      const data = await api.get<TenantComparisonRow[]>(`/admin/reports/tenant-comparison?${params.toString()}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};
