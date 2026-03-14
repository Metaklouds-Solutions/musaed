/**
 * Tenant reports page. Tabbed: Agent | Call Outcomes.
 * Agent: status, sync, channel deployments. Call Outcomes: metrics, charts, comparisons.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Bot } from 'lucide-react';
import { PageHeader, EmptyState, TableSkeleton } from '../../../shared/ui';
import { DateRangePicker } from '../../../components/DateRangePicker';
import { OutcomeBreakdown } from '../components/OutcomeBreakdown';
import { PerformanceMetrics } from '../components/PerformanceMetrics';
import { ABComparisonReport } from '../components/ABComparisonReport/ABComparisonReport';
import { PeriodComparison } from '../components/PeriodComparison/PeriodComparison';
import { SentimentChart } from '../components/SentimentChart/SentimentChart';
import { PeakHoursChart } from '../components/PeakHoursChart/PeakHoursChart';
import { OutcomesOverTimeChart } from '../components/OutcomesOverTimeChart/OutcomesOverTimeChart';
import { IntentAnalyticsChart } from '../components/IntentAnalyticsChart';
import { useReports } from '../hooks/useReports';
import { useSession } from '../../../app/session/SessionContext';
import { AgentStatusCard } from '../../agent/components/AgentStatusCard';
import { AgentSyncStatus } from '../../agent/components/AgentSyncStatus';
import { useAgent } from '../../agent/hooks';
import { cn } from '@/lib/utils';

const DEFAULT_RANGE = (() => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { start, end };
})();

type ReportsTab = 'agent' | 'outcomes';

const TABS: { id: ReportsTab; label: string; icon: typeof Bot }[] = [
  { id: 'outcomes', label: 'Call Outcomes', icon: BarChart3 },
  { id: 'agent', label: 'Agent', icon: Bot },
];

const VALID_TABS = new Set<string>(TABS.map((t) => t.id));

const CARD_MIN_HEIGHT = 260;

function isReportsTab(value: string | null): value is ReportsTab {
  return value !== null && VALID_TABS.has(value);
}

/** Renders tenant reports page with Agent and Call Outcomes tabs. */
export function ReportsPage() {
  const { user } = useSession();
  const tenantId = user?.tenantId;
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<ReportsTab>(
    isReportsTab(tabParam) ? tabParam : 'outcomes',
  );

  const handleTabChange = useCallback(
    (tab: ReportsTab) => {
      setActiveTab(tab);
      setSearchParams(tab === 'outcomes' ? {} : { tab }, { replace: true });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const next = isReportsTab(tabParam) ? tabParam : 'outcomes';
    setActiveTab(next);
  }, [tabParam]);

  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const dateRangeFilter = useMemo(() => ({ start: dateRange.start, end: dateRange.end }), [dateRange]);
  const {
    loading: reportsLoading,
    outcomes,
    performance,
    outcomesByVersion,
    periodComparison,
    sentimentDistribution,
    peakHours,
    outcomesByDay,
    intentDistribution,
  } = useReports(tenantId, dateRangeFilter);

  const { agent, loading: agentLoading } = useAgent();

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" description="Agent overview and call outcomes" />
        <div className="rounded-[var(--radius-card)] card-glass p-8">
          <EmptyState
            icon={BarChart3}
            title="Sign in to view reports"
            description="Select a tenant role on the login page to view your reports."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <PageHeader
            title="Reports"
            description="Agent overview and call outcomes"
          />
          <DateRangePicker value={dateRange} onChange={setDateRange} aria-label="Filter by date range" />
        </div>

        <div
          role="tablist"
          aria-label="Reports section"
          className="inline-flex flex-wrap w-full sm:w-auto gap-1.5 p-2 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm ring-1 ring-black/5"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-[var(--bg-base)] text-[var(--ds-primary)] shadow-md border border-[var(--border-subtle)] ring-1 ring-[var(--ds-primary)]/20'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/60',
              )}
            >
              <tab.icon size={16} aria-hidden className="shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'agent' && (
          <motion.div
            key="agent"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <PerformanceMetrics metrics={performance} />
            {!agent ? (
              agentLoading ? (
                <div className="rounded-[var(--radius-card)] card-glass p-8 text-center">
                  <p className="text-sm text-[var(--text-muted)]">Loading agent...</p>
                </div>
              ) : (
                <div className="rounded-[var(--radius-card)] card-glass p-8 text-center">
                  <Bot className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" aria-hidden />
                  <p className="text-[var(--text-primary)] font-medium">No agent assigned yet</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Contact your admin to deploy an agent to your clinic.
                  </p>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AgentStatusCard agent={agent} />
                <AgentSyncStatus agent={agent} />
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'outcomes' && (
          <motion.div
            key="outcomes"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {reportsLoading ? (
              <TableSkeleton rows={6} cols={4} />
            ) : (
              <>
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  style={{ gridAutoRows: `${CARD_MIN_HEIGHT}px` }}
                >
                  <div
                    className="min-h-[260px] w-full [&>div]:h-full [&>div]:min-h-[260px] [&>div]:rounded-xl"
                  >
                    <OutcomeBreakdown outcomes={outcomes} />
                  </div>
                  <div
                    className="min-h-[260px] w-full [&>div]:h-full [&>div]:min-h-[260px]"
                  >
                    <SentimentChart buckets={sentimentDistribution} />
                  </div>
                  <div
                    className="min-h-[260px] w-full [&>div]:h-full [&>div]:min-h-[260px]"
                  >
                    <PeakHoursChart points={peakHours} />
                  </div>
                  <div
                    className="min-h-[260px] w-full [&>div]:h-full [&>div]:min-h-[260px]"
                  >
                    <IntentAnalyticsChart buckets={intentDistribution} />
                  </div>
                </div>

                <div className="mt-6">
                  <OutcomesOverTimeChart data={outcomesByDay} />
                </div>

                {periodComparison && (
                  <PeriodComparison
                    current={periodComparison.current}
                    previous={periodComparison.previous}
                    label={periodComparison.label}
                  />
                )}

                {outcomesByVersion.length > 0 && (
                  <div className="mt-6">
                    <ABComparisonReport rows={outcomesByVersion} />
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
