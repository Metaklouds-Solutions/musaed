/**
 * Tenant detail Overview tab: profile, billing, configuration, quick stats,
 * agent, and execution history in a compact multi-column layout.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bot, FileText } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  StatCard,
  Modal,
  ModalHeader,
  PopoverSelect,
} from '../../../../shared/ui';
import { RunsTable } from '../../../admin/components/RunsTable';
import { RunEventsViewer } from '../../../admin/components/RunEventsViewer';
import { AgentOverviewTab } from '../AgentDetailTabs/AgentOverviewTab';
import { AgentAnalyticsSummary } from '../AgentDetailTabs/AgentAnalyticsSummary';
import { agentsAdapter, runsAdapter } from '../../../../adapters';
import { useTenantDetail } from '../../hooks/useTenantDetail';
import type { TenantDetailFull, TenantAgentRow, AgentDetailFull } from '../../../../shared/types';
import type { AdminRunRow } from '../../../../adapters/local/runs.adapter';

const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
  ACTIVE: 'active',
  TRIAL: 'pending',
  SUSPENDED: 'error',
};

interface TenantOverviewTabProps {
  tenant: TenantDetailFull;
  agents: TenantAgentRow[];
}

function CompactDl({
  items,
  cols = 2,
}: {
  items: { label: string; value: string | number }[];
  cols?: 2 | 3;
}) {
  return (
    <dl
      className="grid gap-x-4 gap-y-1.5 text-xs"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {items.map(({ label, value }) => (
        <div key={label} className="flex gap-2 min-w-0">
          <dt className="text-[var(--text-muted)] shrink-0">{label}</dt>
          <dd className="font-medium text-[var(--text-primary)] truncate">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Renders tenant overview + agent in a compact multi-column layout. */
export function TenantOverviewTab({ tenant, agents }: TenantOverviewTabProps) {
  const { tenantId } = useTenantDetail();
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin/');

  const { profile, quickStats, billing, settings } = tenant;
  const badgeStatus = statusMap[profile.status] ?? 'inactive';
  const flags = Object.entries(settings.featureFlags ?? {}).filter(([, v]) => v);

  const runs = useMemo(
    () => runsAdapter.listRuns(tenantId ?? undefined),
    [tenantId]
  );
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(() =>
    agents.length === 1 ? agents[0].id : null
  );
  const [agentDetail, setAgentDetail] = useState<AgentDetailFull | null>(null);
  const [loadingAgentDetail, setLoadingAgentDetail] = useState(false);

  useEffect(() => {
    if (agents.length >= 1 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  useEffect(() => {
    if (!selectedAgentId || !tenantId) {
      setAgentDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingAgentDetail(true);
    agentsAdapter
      .getAgentDetailFullAsync(tenantId, selectedAgentId)
      .then((data) => {
        if (!cancelled) setAgentDetail(data);
      })
      .catch(() => {
        if (!cancelled) setAgentDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingAgentDetail(false);
      });
    return () => { cancelled = true; };
  }, [selectedAgentId, tenantId]);
  const events = useMemo(
    () => (selectedRunId ? runsAdapter.getRunEvents(selectedRunId) : []),
    [selectedRunId]
  );
  const handleViewRun = useCallback((run: AdminRunRow) => setSelectedRunId(run.id), []);
  const handleCloseModal = useCallback(() => setSelectedRunId(null), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Profile only in top section */}
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="py-2 px-3 text-sm font-semibold text-[var(--text-primary)]">
          Profile
        </CardHeader>
        <CardBody className="py-2 px-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-[var(--text-primary)] truncate">
              {profile.clinicName}
            </span>
            <Badge status={badgeStatus}>{profile.status}</Badge>
          </div>
          <CompactDl
            items={[
              { label: 'Owner', value: profile.owner },
              { label: 'Email', value: profile.email },
              { label: 'Phone', value: profile.phone },
              { label: 'Plan', value: `${profile.plan} · $${profile.mrr}/mo` },
              { label: 'Created', value: profile.createdAt },
              { label: 'Last active', value: profile.lastActive },
            ]}
            cols={2}
          />
        </CardBody>
      </Card>

      {/* Quick stats: compact 4-column grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <StatCard label="Calls" value={quickStats.totalCalls} className="py-2 px-3" />
        <StatCard label="Bookings" value={quickStats.bookingsCreated} className="py-2 px-3" />
        <StatCard label="Escalations" value={quickStats.escalations} className="py-2 px-3" />
        <StatCard label="Conversion" value={`${quickStats.conversionRate}%`} className="py-2 px-3" />
        <StatCard label="Avg duration" value={quickStats.avgCallDuration} className="py-2 px-3" />
        <StatCard label="Credits used" value={quickStats.creditsUsed} className="py-2 px-3" />
        <StatCard label="Credits left" value={quickStats.creditsRemaining} className="py-2 px-3" />
      </div>

      {/* Agent section - card layout with selector and inline detail */}
      <Card variant="glass">
        <CardHeader className="py-2 px-3 text-sm font-semibold text-[var(--text-primary)] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4" aria-hidden />
            {agents.length === 1 ? agents[0].name : 'Agent'}
          </div>
          {agents.length > 1 && (
            <PopoverSelect
              value={selectedAgentId ?? ''}
              onChange={(v) => setSelectedAgentId(v)}
              options={agents.map((a) => ({ value: a.id, label: a.name }))}
              placeholder="Select agent"
              aria-label="Select agent"
              className="min-w-[180px]"
            />
          )}
        </CardHeader>
        <CardBody className="p-0">
          {agents.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-[var(--text-muted)] text-sm">No agents assigned yet.</p>
            </div>
          ) : (
            selectedAgentId && (
              <div className="px-3 py-4 space-y-4">
                {loadingAgentDetail ? (
                  <p className="text-sm text-[var(--text-muted)]">Loading agent details…</p>
                ) : agentDetail ? (
                  <>
                    <AgentOverviewTab agent={agentDetail} />
                    {tenantId && (
                      <AgentAnalyticsSummary
                        agentId={selectedAgentId}
                        tenantId={tenantId}
                        isAdmin={isAdmin}
                      />
                    )}
                  </>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">Could not load agent details.</p>
                )}
              </div>
            )
          )}
        </CardBody>
      </Card>

      {/* Execution history - collapsible */}
      <details className="group rounded-[var(--radius-card)] card-glass overflow-hidden">
        <summary className="py-2 px-3 text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <FileText className="w-4 h-4 shrink-0" aria-hidden />
          Execution History
          {isAdmin && (
            <span className="text-xs font-normal text-[var(--text-muted)]">(tenant-scoped)</span>
          )}
          <span className="ml-auto text-[var(--text-muted)] group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="border-t border-[var(--border-subtle)]/50">
          {runs.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-[var(--text-muted)] text-sm">No runs yet.</p>
            </div>
          ) : (
            <RunsTable runs={runs} onViewRun={handleViewRun} variant="plain" />
          )}
        </div>
      </details>

      {/* Billing and Configuration - collapsible */}
      <details className="group rounded-[var(--radius-card)] card-glass overflow-hidden">
        <summary className="py-2 px-3 text-sm font-semibold text-[var(--text-primary)] cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          Billing &amp; Configuration
          <span className="ml-2 text-[var(--text-muted)] group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="border-t border-[var(--border-subtle)]/50 p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card variant="glass" className="overflow-hidden">
              <CardHeader className="py-2 px-3 text-sm font-semibold text-[var(--text-primary)]">
                Billing
              </CardHeader>
              <CardBody className="py-2 px-3">
                <CompactDl
                  items={[
                    { label: 'Plan', value: billing.currentPlan },
                    { label: 'Next billing', value: billing.nextBillingDate },
                    { label: 'Last payment', value: billing.lastPayment },
                    { label: 'Method', value: billing.paymentMethod },
                    { label: 'Credits', value: billing.creditsBalance },
                    { label: 'Overage', value: billing.overageRate },
                  ]}
                  cols={2}
                />
              </CardBody>
            </Card>
            <Card variant="glass" className="overflow-hidden">
              <CardHeader className="py-2 px-3 text-sm font-semibold text-[var(--text-primary)]">
                Configuration
              </CardHeader>
              <CardBody className="py-2 px-3">
                <CompactDl
                  items={[
                    { label: 'Hours', value: settings.businessHours },
                    { label: 'After-hours', value: settings.afterHoursBehavior },
                    { label: 'Notifications', value: settings.notifications },
                    { label: 'PMS', value: settings.pmsIntegration },
                    ...(flags.length > 0
                      ? [{ label: 'Flags', value: flags.map(([k]) => k).join(', ') }]
                      : []),
                  ]}
                  cols={2}
                />
              </CardBody>
            </Card>
          </div>
        </div>
      </details>

      <Modal
        open={selectedRunId !== null}
        onClose={handleCloseModal}
        title={selectedRunId ? `Run ${selectedRunId}` : 'Run events'}
      >
        <ModalHeader
          title={selectedRunId ? `Run ${selectedRunId}` : 'Run events'}
          onClose={handleCloseModal}
        />
        <div className="p-5">
          <RunEventsViewer events={events} />
        </div>
      </Modal>
    </motion.div>
  );
}
