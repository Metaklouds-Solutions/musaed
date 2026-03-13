/**
 * Agent detail Overview tab: identity, sync status, voice, and language in a compact grid.
 */

import { motion } from 'motion/react';
import { Badge } from '../../../../shared/ui';
import { getRetellAgentUrl } from '../../../../lib/retell';
import type { AgentDetailFull } from '../../../../shared/types';

interface AgentOverviewTabProps {
  agent: AgentDetailFull;
}

function CompactDl({
  items,
  cols = 3,
}: {
  items: { label: string; value: React.ReactNode }[];
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
          <dd className="font-medium text-[var(--text-primary)] truncate min-w-0">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Renders core agent identity, sync state, voice, and language in a compact definition list. */
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
    >
      <CompactDl
        cols={3}
        items={[
          { label: 'Name', value: agent.name },
          { label: 'Channel', value: agent.channel },
          {
            label: 'Retell Agent ID',
            value: agent.retellAgentId ? (
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
            ),
          },
          {
            label: 'Sync status',
            value: (
              <Badge status={agent.syncStatus === 'In Sync' ? 'active' : 'pending'}>
                {agent.syncStatus}
              </Badge>
            ),
          },
          { label: 'Voice', value: agent.voiceConfig.voiceName },
          { label: 'Language', value: language },
        ]}
      />
    </motion.div>
  );
}
