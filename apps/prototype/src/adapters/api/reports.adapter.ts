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
  getOutcomes(_tenantId: string | undefined, _dateRange?: DateRangeFilter): OutcomeBreakdown[] {
    return [
      { outcome: 'booked', count: 0, percentage: 0 },
      { outcome: 'escalated', count: 0, percentage: 0 },
      { outcome: 'failed', count: 0, percentage: 0 },
    ];
  },

  async getPerformance(_tenantId: string | undefined, _dateRange?: DateRangeFilter): Promise<PerformanceMetrics> {
    try {
      const data = await api.get<any>('/tenant/reports/performance');
      return {
        totalCalls: 0,
        totalBookings: data.totalBookings ?? 0,
        avgDurationSec: 0,
        conversionRate: 0,
        escalationRate: 0,
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

  getOutcomesByVersion(_tenantId: string | undefined, _dateRange?: DateRangeFilter): ABTestOutcomeRow[] {
    return [];
  },

  getPerformanceForPeriod(
    _tenantId: string | undefined,
    _period: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth',
  ): PerformanceMetrics {
    return defaultPerformance;
  },

  getSentimentDistribution(_tenantId: string | undefined, _dateRange?: DateRangeFilter): SentimentBucket[] {
    return [];
  },

  getPeakHours(_tenantId: string | undefined, _dateRange?: DateRangeFilter): PeakHourPoint[] {
    return [];
  },

  getIntentDistribution(_tenantId: string | undefined, _dateRange?: DateRangeFilter): IntentBucket[] {
    return [];
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
