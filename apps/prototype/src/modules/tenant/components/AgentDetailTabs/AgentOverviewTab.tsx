/**
 * Agent detail Overview tab: identity, sync status, voice, and language.
 * Responsive layout: stacked on mobile, grid on larger screens.
 */

import { motion } from 'motion/react';
import { Badge } from '../../../../shared/ui';
import { getRetellAgentUrl } from '../../../../lib/retell';
import type { AgentDetailFull } from '../../../../shared/types';

interface AgentOverviewTabProps {
  agent: AgentDetailFull;
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

/** Renders core agent identity, sync state, voice, and language. */
export function AgentOverviewTab({ agent }: AgentOverviewTabProps) {
  const language =
    agent.chatConfig.status !== 'Not Configured' && agent.chatConfig.languages?.length
      ? agent.chatConfig.languages.join(', ')
      : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg bg-[var(--bg-subtle)]/50 border border-[var(--border-subtle)]/50 overflow-hidden"
    >
      <dl className="px-4 sm:px-5">
        <InfoRow label="Name" value={agent.name} />
        <InfoRow label="Channel" value={<span className="capitalize">{agent.channel}</span>} />
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
        <InfoRow label="Voice" value={agent.voiceConfig.voiceName} />
        <InfoRow label="Language" value={language} />
      </dl>
    </motion.div>
  );
}
