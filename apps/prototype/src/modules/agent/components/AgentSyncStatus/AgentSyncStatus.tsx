/**
 * Displays real channel deployment status for the tenant's agent.
 * Fetches deployments from the backend and shows each channel with its status.
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Phone, MessageSquare, Mail, Radio } from 'lucide-react';
import { StatusDot } from '../../../../shared/ui';
import type { StatusDotVariant } from '../../../../shared/ui';
import { useAgentDeployments } from '../../hooks';
import type { TenantAgentDetail } from '../../../../shared/types';
import type { ChannelDeploymentSummary } from '../../../../shared/types';
import type { LucideIcon } from 'lucide-react';

interface AgentSyncStatusProps {
  agent: TenantAgentDetail | null;
}

const CHANNEL_META: Record<string, { icon: LucideIcon; label: string }> = {
  voice: { icon: Phone, label: 'Voice' },
  chat: { icon: MessageSquare, label: 'Chat' },
  email: { icon: Mail, label: 'Email' },
};

const STATUS_VARIANT: Record<ChannelDeploymentSummary['status'], StatusDotVariant> = {
  active: 'active',
  pending: 'warning',
  failed: 'error',
};

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function ChannelRow({ deployment }: { deployment: ChannelDeploymentSummary }) {
  const meta = CHANNEL_META[deployment.channel] ?? { icon: Radio, label: deployment.channel };
  const Icon = meta.icon;
  const variant = STATUS_VARIANT[deployment.status];

  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[var(--ds-primary)]/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[var(--ds-primary)]" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)]">{meta.label}</p>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {deployment.provider}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-[var(--text-muted)]">
          {formatTimestamp(deployment.updatedAt)}
        </span>
        <StatusDot variant={variant} label={deployment.status} />
      </div>
    </div>
  );
}

export function AgentSyncStatus({ agent }: AgentSyncStatusProps) {
  const agentId = agent?.id;
  const { deployments, loading } = useAgentDeployments(agentId);

  const sortedDeployments = useMemo(
    () =>
      [...deployments].sort((a, b) => {
        const order = { active: 0, pending: 1, failed: 2 };
        return order[a.status] - order[b.status];
      }),
    [deployments],
  );

  if (!agent) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="rounded-[var(--radius-card)] card-glass p-5"
    >
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Channel Deployments
      </h2>

      {loading && (
        <p className="text-sm text-[var(--text-muted)] py-4 text-center">
          Loading deployments…
        </p>
      )}

      {!loading && sortedDeployments.length === 0 && (
        <div className="py-4 text-center">
          <Radio className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" aria-hidden />
          <p className="text-sm text-[var(--text-muted)]">No channels deployed yet</p>
        </div>
      )}

      {!loading && sortedDeployments.length > 0 && (
        <div className="divide-y divide-[var(--border-default)]">
          {sortedDeployments.map((dep) => (
            <ChannelRow key={dep.id} deployment={dep} />
          ))}
        </div>
      )}
    </motion.section>
  );
}
