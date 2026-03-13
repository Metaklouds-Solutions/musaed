/**
 * Agent analytics summary: quick stats, outcome/sentiment breakdown,
 * latency, disconnection reasons, and recent calls.
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Phone, TrendingUp, DollarSign, Clock } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  StatCard,
  DataTable,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PillTag,
  Skeleton,
} from '../../../../shared/ui';
import { analyticsAdapter, callsAdapter } from '../../../../adapters';
import { useAsyncData } from '../../../../shared/hooks/useAsyncData';
import type { CallAnalyticsResponse } from '../../../../adapters/api/analytics.adapter';
import type { Call } from '../../../../shared/types';
import type { DateRangeFilter } from '../../../../adapters/local/calls.adapter';

const DEFAULT_RANGE: DateRangeFilter = (() => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { start, end };
})();

const EMPTY_ANALYTICS: CallAnalyticsResponse = {
  totalCalls: 0,
  conversationRate: 0,
  avgDuration: 0,
  outcomes: {
    booked: 0,
    escalated: 0,
    failed: 0,
    info_only: 0,
    unknown: 0,
  },
  sentiment: {
    positive: 0,
    neutral: 0,
    negative: 0,
  },
};

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

interface AgentAnalyticsSummaryProps {
  agentId: string;
  tenantId: string;
  isAdmin: boolean;
}

/** Renders agent call analytics in a 2-column grid. */
export function AgentAnalyticsSummary({
  agentId,
  tenantId,
  isAdmin,
}: AgentAnalyticsSummaryProps) {
  const analyticsFetcher = useMemo(
    () => () =>
      isAdmin
        ? analyticsAdapter.getAdminCallAnalytics({ agentId, tenantId })
        : analyticsAdapter.getTenantCallAnalytics(tenantId, { agentId }),
    [agentId, tenantId, isAdmin],
  );
  const { data: analytics, loading: analyticsLoading } = useAsyncData(
    analyticsFetcher,
    [agentId, tenantId, isAdmin],
    EMPTY_ANALYTICS,
  );

  const recentCallsFetcher = useMemo(
    () => async (): Promise<Call[]> => {
      const calls = await callsAdapter.getCalls(tenantId, DEFAULT_RANGE);
      const byAgent = agentId
        ? calls.filter((c) => c.agentId === agentId)
        : calls;
      return byAgent
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);
    },
    [tenantId, agentId],
  );
  const { data: recentCalls, loading: callsLoading } = useAsyncData(
    recentCallsFetcher,
    [tenantId, agentId],
    [] as Call[],
  );

  const outcomeEntries = Object.entries(analytics.outcomes).filter(
    ([, v]) => v > 0,
  );
  const totalOutcomes = outcomeEntries.reduce((s, [, v]) => s + v, 0);
  const sentimentEntries = Object.entries(analytics.sentiment).filter(
    ([, v]) => v > 0,
  );
  const totalSentiment = sentimentEntries.reduce((s, [, v]) => s + v, 0);
  const disconnectionEntries = Object.entries(
    analytics.disconnectionReasons ?? {},
  ).filter(([, v]) => v > 0);

  const isLoading = analyticsLoading;
  const hasData =
    analytics.totalCalls > 0 ||
    (analytics.disconnectionReasons &&
      Object.keys(analytics.disconnectionReasons).length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {isLoading && !hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatCard
                label="Total Calls"
                value={analytics.totalCalls}
                className="py-2 px-3"
              />
              <StatCard
                label="Avg Duration"
                value={formatDuration(analytics.avgDuration)}
                className="py-2 px-3"
              />
              <StatCard
                label="Success Rate"
                value={
                  analytics.successRate != null
                    ? `${(analytics.successRate * 100).toFixed(1)}%`
                    : '—'
                }
                className="py-2 px-3"
              />
              <StatCard
                label="Avg Cost"
                value={
                  analytics.avgCost != null
                    ? `$${analytics.avgCost.toFixed(2)}`
                    : '—'
                }
                className="py-2 px-3"
              />
            </div>

            {/* Outcome breakdown */}
            <Card variant="glass">
              <CardHeader className="py-2 px-3 text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <BarChart3 className="w-4 h-4" aria-hidden />
                Outcome breakdown
              </CardHeader>
              <CardBody className="py-2 px-3">
                {outcomeEntries.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    No outcome data yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {outcomeEntries.map(([label, count]) => {
                      const pct =
                        totalOutcomes > 0
                          ? (count / totalOutcomes) * 100
                          : 0;
                      return (
                        <div
                          key={label}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span
                            className="w-20 shrink-0 text-[var(--text-secondary)] capitalize"
                            style={{
                              textTransform: 'capitalize',
                            }}
                          >
                            {label.replace('_', ' ')}
                          </span>
                          <div className="flex-1 min-w-0 h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--ds-primary)]/60 rounded-full transition-all"
                              style={{ width: `${Math.max(2, pct)}%` }}
                            />
                          </div>
                          <span className="w-12 shrink-0 text-right font-medium text-[var(--text-primary)]">
                            {count} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Sentiment breakdown */}
            <Card variant="glass">
              <CardHeader className="py-2 px-3 text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <TrendingUp className="w-4 h-4" aria-hidden />
                Sentiment breakdown
              </CardHeader>
              <CardBody className="py-2 px-3">
                {sentimentEntries.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    No sentiment data yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {sentimentEntries.map(([label, count]) => {
                      const pct =
                        totalSentiment > 0
                          ? (count / totalSentiment) * 100
                          : 0;
                      return (
                        <li
                          key={label}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-[var(--text-secondary)] capitalize">
                            {label}
                          </span>
                          <span className="font-medium text-[var(--text-primary)]">
                            {count} ({pct.toFixed(0)}%)
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Avg latency */}
            <Card variant="glass">
              <CardHeader className="py-2 px-3 text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Clock className="w-4 h-4" aria-hidden />
                Avg Latency
              </CardHeader>
              <CardBody className="py-2 px-3">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {analytics.avgLatency != null
                    ? `${analytics.avgLatency}ms`
                    : '—'}
                </p>
              </CardBody>
            </Card>

            {/* Disconnection reasons */}
            <Card variant="glass">
              <CardHeader className="py-2 px-3 text-sm font-semibold text-[var(--text-primary)]">
                Disconnection reasons
              </CardHeader>
              <CardBody className="py-2 px-3">
                {disconnectionEntries.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    No disconnection data yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {disconnectionEntries.map(([reason, count]) => (
                      <li
                        key={reason}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-[var(--text-secondary)] truncate">
                          {reason}
                        </span>
                        <span className="font-medium text-[var(--text-primary)] shrink-0 ml-2">
                          {count}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            {/* Recent calls */}
            <Card variant="glass">
              <CardHeader className="py-2 px-3 text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Phone className="w-4 h-4" aria-hidden />
                Recent calls
              </CardHeader>
              <CardBody className="p-0">
                {callsLoading ? (
                  <div className="p-4">
                    <Skeleton className="h-20 w-full rounded" />
                  </div>
                ) : recentCalls.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-xs text-[var(--text-muted)]">
                      No recent calls.
                    </p>
                  </div>
                ) : (
                  <DataTable minWidth="min-w-[400px]" variant="plain">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Outcome</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentCalls.map((c) => (
                          <TableRow
                            key={c.id}
                            className="border-t border-[var(--border-subtle)]/50 first:border-t-0"
                          >
                            <TableCell className="text-sm text-[var(--text-secondary)]">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-sm text-[var(--text-secondary)]">
                              {formatDuration(c.duration)}
                            </TableCell>
                            <TableCell>
                              <PillTag
                                variant={
                                  c.outcome === 'booked'
                                    ? 'outcomeBooked'
                                    : c.outcome === 'escalated'
                                      ? 'outcomeEscalated'
                                      : c.outcome === 'failed'
                                        ? 'outcomeFailed'
                                        : 'role'
                                }
                              >
                                {c.outcome ?? 'unknown'}
                              </PillTag>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </DataTable>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </motion.div>
  );
}
