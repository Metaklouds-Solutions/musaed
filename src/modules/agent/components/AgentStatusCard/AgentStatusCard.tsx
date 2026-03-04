/**
 * Agent status: voice, language, status.
 */

import { motion } from 'motion/react';
import { Bot, CheckCircle } from 'lucide-react';
import type { TenantAgentDetail } from '../../../../shared/types';

interface AgentStatusCardProps {
  agent: TenantAgentDetail | null;
}

export function AgentStatusCard({ agent }: AgentStatusCardProps) {
  if (!agent) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-[var(--radius-card)] card-glass p-5"
    >
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Status</h2>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--ds-primary)]/10 flex items-center justify-center shrink-0">
          <Bot className="w-6 h-6 text-[var(--ds-primary)]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--text-primary)]">Voice: {agent.voice}</span>
            <span className="text-sm text-[var(--text-muted)]">({agent.language})</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle
              size={16}
              className={agent.status === 'active' ? 'text-[var(--success)]' : 'text-[var(--warning)]'}
              aria-hidden
            />
            <span className="text-sm font-medium capitalize">{agent.status}</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
