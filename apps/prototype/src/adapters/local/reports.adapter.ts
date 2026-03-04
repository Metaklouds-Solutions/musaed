/**
 * Local reports adapter. Outcomes and performance from calls/bookings.
 * Optional dateRange filters by createdAt.
 * Scheduled reports config (localStorage; actual email sending requires backend).
 */

import { seedCalls, seedBookings, seedTenants } from '../../mock/seedData';

const SCHEDULED_REPORTS_KEY = 'clinic-crm-scheduled-reports';

export interface ScheduledReportConfig {
  enabled: boolean;
  frequency: 'weekly' | 'monthly';
  recipients: string[];
  /** Day of week for weekly (0=Sun, 1=Mon, …, 6=Sat). */
  dayOfWeek?: number;
  /** Day of month for monthly (1–31). */
  dayOfMonth?: number;
}

const defaultScheduledConfig: ScheduledReportConfig = {
  enabled: false,
  frequency: 'weekly',
  recipients: [],
  dayOfWeek: 1,
  dayOfMonth: 1,
};
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

export interface DateRangeFilter {
  start: Date;
  end: Date;
}

function filterByTenant<T extends { tenantId: string }>(items: T[], tenantId: string | undefined): T[] {
  if (tenantId == null) return items;
  return items.filter((x) => x.tenantId === tenantId);
}

function filterByDateRange<T extends { createdAt: string }>(items: T[], range?: DateRangeFilter): T[] {
  if (!range) return items;
  const startMs = range.start.getTime();
  const endMs = range.end.getTime() + 86400000;
  return items.filter((c) => {
    const ms = new Date(c.createdAt).getTime();
    return ms >= startMs && ms < endMs;
  });
}

export const reportsAdapter = {
  /** Outcome breakdown: booked / escalated / failed. */
  getOutcomes(tenantId: string | undefined, dateRange?: DateRangeFilter): OutcomeBreakdown[] {
    const calls = filterByDateRange(filterByTenant(seedCalls, tenantId), dateRange);
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
  getPerformance(tenantId: string | undefined, dateRange?: DateRangeFilter): PerformanceMetrics {
    const calls = filterByDateRange(filterByTenant(seedCalls, tenantId), dateRange);
    const bookings = filterByDateRange(filterByTenant(seedBookings, tenantId), dateRange);
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

  /** Get scheduled report config (admin digest). */
  getScheduledReportConfig(): ScheduledReportConfig {
    const stored = localStorage.getItem(SCHEDULED_REPORTS_KEY);
    if (!stored) return { ...defaultScheduledConfig };
    try {
      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { ...defaultScheduledConfig };
      }
      const o = parsed as Record<string, unknown>;
      const recipients = Array.isArray(o.recipients)
        ? (o.recipients as unknown[]).filter((r): r is string => typeof r === 'string')
        : [];
      return {
        ...defaultScheduledConfig,
        enabled: typeof o.enabled === 'boolean' ? o.enabled : defaultScheduledConfig.enabled,
        frequency:
          o.frequency === 'weekly' || o.frequency === 'monthly'
            ? o.frequency
            : defaultScheduledConfig.frequency,
        recipients,
        dayOfWeek: typeof o.dayOfWeek === 'number' ? o.dayOfWeek : defaultScheduledConfig.dayOfWeek,
        dayOfMonth: typeof o.dayOfMonth === 'number' ? o.dayOfMonth : defaultScheduledConfig.dayOfMonth,
      };
    } catch {
      return { ...defaultScheduledConfig };
    }
  },

  /** Save scheduled report config. */
  setScheduledReportConfig(config: ScheduledReportConfig): void {
    try {
      localStorage.setItem(SCHEDULED_REPORTS_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  },

  /** A/B test comparison: outcomes by agent version. */
  getOutcomesByVersion(tenantId: string | undefined, dateRange?: DateRangeFilter): ABTestOutcomeRow[] {
    const calls = filterByDateRange(filterByTenant(seedCalls, tenantId), dateRange);
    const byVersion = new Map<string, typeof calls>();
    for (const c of calls) {
      const v = c.agentVersion ?? 'default';
      let arr = byVersion.get(v);
      if (!arr) {
        arr = [];
        byVersion.set(v, arr);
      }
      arr.push(c);
    }
    const rows: ABTestOutcomeRow[] = [];
    for (const [version, versionCalls] of byVersion) {
      const total = versionCalls.length;
      const booked = versionCalls.filter((c) => c.bookingCreated).length;
      const escalated = versionCalls.filter((c) => c.escalationFlag && !c.bookingCreated).length;
      const failed = total - booked - escalated;
      const totalDuration = versionCalls.reduce((s, c) => s + c.duration, 0);
      const totalSentiment = versionCalls.reduce((s, c) => s + c.sentimentScore, 0);
      rows.push({
        version,
        totalCalls: total,
        booked,
        escalated,
        failed,
        conversionRate: total > 0 ? Math.round((booked / total) * 100) : 0,
        escalationRate: total > 0 ? Math.round((escalated / total) * 100) : 0,
        avgDurationSec: total > 0 ? Math.round(totalDuration / total) : 0,
        sentimentAvg: total > 0 ? Math.round(totalSentiment / total * 100) / 100 : 0,
      });
    }
    return rows.sort((a, b) => a.version.localeCompare(b.version));
  },

  /** Tenant comparison: metrics for multiple tenants (admin). */
  getTenantComparison(tenantIds: string[], dateRange?: DateRangeFilter): TenantComparisonRow[] {
    const rows: TenantComparisonRow[] = [];
    for (const tenantId of tenantIds) {
      const perf = this.getPerformance(tenantId, dateRange);
      const tenant = seedTenants.find((t) => t.id === tenantId);
      rows.push({
        tenantId,
        tenantName: tenant?.name ?? tenantId,
        totalCalls: perf.totalCalls,
        totalBookings: perf.totalBookings,
        conversionRate: perf.conversionRate,
        escalationRate: perf.escalationRate,
        avgDurationSec: perf.avgDurationSec,
        sentimentAvg: perf.sentimentAvg,
      });
    }
    return rows;
  },

  /** Performance for a specific period (for time comparison). */
  getPerformanceForPeriod(
    tenantId: string | undefined,
    period: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth'
  ): PerformanceMetrics {
    const now = new Date();
    let start: Date;
    let end: Date;
    if (period === 'thisWeek') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'lastWeek') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now);
      start.setDate(diff - 7);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setDate(diff - 1);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }
    return this.getPerformance(tenantId, { start, end });
  },

  /** Sentiment distribution: positive / neutral / negative buckets. */
  getSentimentDistribution(tenantId: string | undefined, dateRange?: DateRangeFilter): SentimentBucket[] {
    const calls = filterByDateRange(filterByTenant(seedCalls, tenantId), dateRange);
    const total = calls.length;
    if (total === 0) {
      return [
        { label: 'Positive', range: '0.8–1.0', count: 0, percentage: 0 },
        { label: 'Neutral', range: '0.5–0.8', count: 0, percentage: 0 },
        { label: 'Negative', range: '0–0.5', count: 0, percentage: 0 },
      ];
    }
    const positive = calls.filter((c) => c.sentimentScore >= 0.8).length;
    const neutral = calls.filter((c) => c.sentimentScore >= 0.5 && c.sentimentScore < 0.8).length;
    const negative = total - positive - neutral;
    return [
      { label: 'Positive', range: '0.8–1.0', count: positive, percentage: Math.round((positive / total) * 100) },
      { label: 'Neutral', range: '0.5–0.8', count: neutral, percentage: Math.round((neutral / total) * 100) },
      { label: 'Negative', range: '0–0.5', count: negative, percentage: Math.round((negative / total) * 100) },
    ];
  },

  /** Peak hours: calls per hour (0–23). */
  getPeakHours(tenantId: string | undefined, dateRange?: DateRangeFilter): PeakHourPoint[] {
    const calls = filterByDateRange(filterByTenant(seedCalls, tenantId), dateRange);
    const byHour = new Map<number, number>();
    for (let h = 0; h < 24; h++) byHour.set(h, 0);
    for (const c of calls) {
      const hour = new Date(c.createdAt).getUTCHours();
      byHour.set(hour, (byHour.get(hour) ?? 0) + 1);
    }
    return Array.from(byHour.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([hour, count]) => {
        const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour < 12 ? 'am' : 'pm';
        return { hour, label: `${h}${ampm}`, count };
      });
  },

  /** Intent distribution: derived from transcript keywords. */
  getIntentDistribution(tenantId: string | undefined, dateRange?: DateRangeFilter): IntentBucket[] {
    const calls = filterByDateRange(filterByTenant(seedCalls, tenantId), dateRange);
    const total = calls.length;
    const intents = ['complaint', 'billing', 'reschedule', 'booking', 'general'];
    const keywords: Record<string, string[]> = {
      complaint: ['upset', 'complaint', 'wait time', 'angry', 'frustrated'],
      billing: ['billing', 'charged', 'charge', 'payment', 'invoice'],
      reschedule: ['reschedule', 'rescheduling', 'change appointment'],
      booking: ['book', 'booking', 'appointment', 'schedule', 'checkup', 'slot'],
      general: [],
    };
    const counts = new Map<string, number>();
    for (const intent of intents) counts.set(intent, 0);
    for (const c of calls) {
      const t = (c.transcript ?? '').toLowerCase();
      let matched = false;
      for (const intent of ['complaint', 'billing', 'reschedule', 'booking'] as const) {
        if (keywords[intent].some((k) => t.includes(k))) {
          counts.set(intent, (counts.get(intent) ?? 0) + 1);
          matched = true;
          break;
        }
      }
      if (!matched) counts.set('general', (counts.get('general') ?? 0) + 1);
    }
    const labels: Record<string, string> = {
      complaint: 'Complaint',
      billing: 'Billing',
      reschedule: 'Reschedule',
      booking: 'Booking',
      general: 'General',
    };
    const buckets = intents.map((intent) => ({
      label: labels[intent],
      count: counts.get(intent) ?? 0,
      percentage: total > 0 ? Math.round(((counts.get(intent) ?? 0) / total) * 100) : 0,
    }));
    const withData = buckets.filter((b) => b.count > 0);
    return withData.length > 0 ? withData : [{ label: 'General', count: 0, percentage: 0 }];
  },

  /** Outcomes by day for trend chart. */
  getOutcomesByDay(tenantId: string | undefined, dateRange?: DateRangeFilter): OutcomesByDay[] {
    const calls = filterByDateRange(filterByTenant(seedCalls, tenantId), dateRange);
    const byDate = new Map<string, { booked: number; escalated: number; failed: number }>();
    for (const c of calls) {
      const date = c.createdAt.slice(0, 10);
      if (!byDate.has(date)) byDate.set(date, { booked: 0, escalated: 0, failed: 0 });
      const row = byDate.get(date)!;
      if (c.bookingCreated) row.booked++;
      else if (c.escalationFlag) row.escalated++;
      else row.failed++;
    }
    return Array.from(byDate.entries())
      .map(([date, row]) => ({
        date,
        ...row,
        total: row.booked + row.escalated + row.failed,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};
