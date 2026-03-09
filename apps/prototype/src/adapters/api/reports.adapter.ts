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

  getScheduledReportConfig(): ScheduledReportConfig {
    return { enabled: false, frequency: 'weekly', recipients: [], dayOfWeek: 1, dayOfMonth: 1 };
  },

  setScheduledReportConfig(_config: ScheduledReportConfig): void {},

  getOutcomesByVersion(_tenantId: string | undefined, _dateRange?: DateRangeFilter): ABTestOutcomeRow[] {
    return [];
  },

  getTenantComparison(_tenantIds: string[], _dateRange?: DateRangeFilter): TenantComparisonRow[] {
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

  getOutcomesByDay(_tenantId: string | undefined, _dateRange?: DateRangeFilter): OutcomesByDay[] {
    return [];
  },
};
