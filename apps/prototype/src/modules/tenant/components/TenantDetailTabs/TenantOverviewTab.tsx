/**
 * Tenant detail Overview tab: profile, quick stats, and agent.
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bot } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  StatCard,
  PopoverSelect,
} from '../../../../shared/ui';
import { AgentOverviewTab } from '../AgentDetailTabs/AgentOverviewTab';
import { AgentAnalyticsSummary } from '../AgentDetailTabs/AgentAnalyticsSummary';
import { agentsAdapter } from '../../../../adapters';
import { useTenantDetail } from '../../hooks/useTenantDetail';
import type { TenantDetailFull, TenantAgentRow, AgentDetailFull } from '../../../../shared/types';

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

  const { profile, quickStats } = tenant;
  const badgeStatus = statusMap[profile.status] ?? 'inactive';

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
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="py-4 px-4 sm:px-6 text-sm font-semibold text-[var(--text-primary)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Bot className="w-5 h-5 shrink-0 text-[var(--text-muted)]" aria-hidden />
            <span className="truncate">{agents.length === 1 ? agents[0].name : 'Agent'}</span>
          </div>
          {agents.length > 1 && (
            <PopoverSelect
              value={selectedAgentId ?? ''}
              onChange={(v) => setSelectedAgentId(v)}
              options={agents.map((a) => ({ value: a.id, label: a.name }))}
              placeholder="Select agent"
              aria-label="Select agent"
              className="min-w-0 sm:min-w-[200px] w-full sm:w-auto"
            />
          )}
        </CardHeader>
        <CardBody className="p-0">
          {agents.length === 0 ? (
            <div className="p-8 sm:p-10 text-center">
              <p className="text-[var(--text-muted)] text-sm">No agents assigned yet.</p>
            </div>
          ) : (
            selectedAgentId && (
              <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-6 border-t border-[var(--border-subtle)]/50">
                {loadingAgentDetail ? (
                  <p className="text-sm text-[var(--text-muted)] py-4">Loading agent details…</p>
                ) : agentDetail ? (
                  <>
                    <section aria-labelledby="agent-identity-heading">
                      <h3 id="agent-identity-heading" className="sr-only">Agent identity</h3>
                      <AgentOverviewTab agent={agentDetail} />
                    </section>
                    {tenantId && (
                      <section aria-labelledby="agent-analytics-heading" className="pt-4 border-t border-[var(--border-subtle)]/50">
                        <h3 id="agent-analytics-heading" className="text-sm font-semibold text-[var(--text-secondary)] mb-4">
                          Analytics
                        </h3>
                        <AgentAnalyticsSummary
                          agentId={selectedAgentId}
                          tenantId={tenantId}
                          isAdmin={isAdmin}
                        />
                      </section>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] py-4">Could not load agent details.</p>
                )}
              </div>
            )
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}
