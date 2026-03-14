/**
 * Agent analytics summary: quick stats and outcome breakdown.
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  StatCard,
  Skeleton,
} from '../../../../shared/ui';
import { analyticsAdapter } from '../../../../adapters';
import { useAsyncData } from '../../../../shared/hooks/useAsyncData';
import type { CallAnalyticsResponse } from '../../../../adapters/api/analytics.adapter';

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

  const outcomeEntries = Object.entries(analytics.outcomes).filter(
    ([, v]) => v > 0,
  );
  const totalOutcomes = outcomeEntries.reduce((s, [, v]) => s + v, 0);

  const isLoading = analyticsLoading;
  const hasData = analytics.totalCalls > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {isLoading && !hasData ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
            <StatCard
              label="Total Calls"
              value={analytics.totalCalls}
              className="py-3 px-4 min-w-0"
            />
            <StatCard
              label="Avg Duration"
              value={formatDuration(analytics.avgDuration)}
              className="py-3 px-4 min-w-0"
            />
            <StatCard
              label="Success Rate"
              value={
                analytics.successRate != null
                  ? `${(analytics.successRate * 100).toFixed(1)}%`
                  : '—'
              }
              className="py-3 px-4 min-w-0"
            />
            <StatCard
              label="Avg Cost"
              value={
                analytics.avgCost != null
                  ? `$${analytics.avgCost.toFixed(2)}`
                  : '—'
              }
              className="py-3 px-4 min-w-0"
            />
          </div>

          {/* Outcome breakdown - only when there's data */}
          {outcomeEntries.length > 0 && (
            <Card variant="glass" className="min-w-0 overflow-hidden">
              <CardHeader className="py-3 px-4 text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 shrink-0" aria-hidden />
                Outcome breakdown
              </CardHeader>
              <CardBody className="py-3 px-4">
                <div className="space-y-2">
                  {outcomeEntries.map(([label, count]) => {
                    const pct =
                      totalOutcomes > 0 ? (count / totalOutcomes) * 100 : 0;
                    return (
                      <div
                        key={label}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="w-20 shrink-0 text-[var(--text-secondary)] capitalize">
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
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </motion.div>
  );
}
