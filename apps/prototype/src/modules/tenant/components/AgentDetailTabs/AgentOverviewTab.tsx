/**
 * Agent detail Overview tab: identity, channel, live status, sync, voice, language.
 * Live status and Voice/Language shown only when data is available.
 */

import { motion } from 'motion/react';
import { Badge } from '../../../../shared/ui';
import { getRetellAgentUrl } from '../../../../lib/retell';
import type { AgentDetailFull } from '../../../../shared/types';

interface AgentOverviewTabProps {
  agent: AgentDetailFull;
  /** Optional live status (active/paused/archived) from tenant agent. Shown when provided. */
  status?: string;
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 sm:py-2.5 border-b border-[var(--border-subtle)]/50 last:border-b-0 min-w-0">
      <dt className="text-xs sm:text-sm text-[var(--text-muted)] shrink-0 sm:w-32">{label}</dt>
      <dd className="text-sm font-medium text-[var(--text-primary)] truncate min-w-0">{value}</dd>
    </div>
  );
}

const EMPTY_PLACEHOLDER = '—';

/** Renders core agent identity, sync state, channel, live status. Voice/Language only when present. */
export function AgentOverviewTab({ agent, status }: AgentOverviewTabProps) {
  const language =
    agent.chatConfig.status !== 'Not Configured' && agent.chatConfig.languages?.length
      ? agent.chatConfig.languages.join(', ')
      : '';
  const hasLanguage = !!language && language !== EMPTY_PLACEHOLDER;
  const voice = agent.voiceConfig?.voiceName?.trim() || '';
  const hasVoice = !!voice && voice !== EMPTY_PLACEHOLDER;
  const statusLower = status?.toLowerCase() ?? '';
  const isActive = statusLower === 'active';
  const statusLabel = statusLower === 'active' ? 'Active' : statusLower === 'paused' ? 'Paused' : statusLower === 'archived' ? 'Archived' : status || 'Inactive';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg panel-soft overflow-hidden"
    >
      <dl className="px-4 sm:px-5">
        <InfoRow label="Name" value={agent.name} />
        <InfoRow label="Channel" value={<span className="capitalize">{agent.channel}</span>} />
        {status !== undefined && (
          <InfoRow
            label="Live status"
            value={
              <Badge status={isActive ? 'active' : statusLower === 'archived' ? 'inactive' : 'pending'}>
                {statusLabel}
              </Badge>
            }
          />
        )}
        <InfoRow
          label="Retell Agent ID"
          value={
            agent.retellAgentId ? (
              <a
                href={getRetellAgentUrl(agent.retellAgentId)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[var(--ds-primary)] hover:underline truncate block"
              >
                {agent.retellAgentId}
              </a>
            ) : (
              '—'
            )
          }
        />
        <InfoRow
          label="Sync status"
          value={
            <Badge status={agent.syncStatus === 'In Sync' ? 'active' : 'pending'}>
              {agent.syncStatus}
            </Badge>
          }
        />
        {hasVoice && <InfoRow label="Voice" value={voice} />}
        {hasLanguage && <InfoRow label="Language" value={language} />}
      </dl>
    </motion.div>
  );
}

