/**
 * Agent skills: enabled skills with priority.
 */

import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import type { TenantAgentDetail } from '../../../../shared/types';

interface AgentSkillsPanelProps {
  agent: TenantAgentDetail | null;
}

export function AgentSkillsPanel({ agent }: AgentSkillsPanelProps) {
  if (!agent) return null;

  if (agent.enabledSkills.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-[var(--radius-card)] card-glass p-5"
      >
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Skills</h2>
        <p className="text-sm text-[var(--text-muted)]">No skills enabled yet.</p>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-[var(--radius-card)] card-glass p-5"
    >
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Enabled Skills</h2>
      <ul className="space-y-2">
        {agent.enabledSkills.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[var(--bg-elevated)]/50"
          >
            <Sparkles className="w-4 h-4 text-[var(--ds-primary)] shrink-0" aria-hidden />
            <span className="font-medium text-[var(--text-primary)]">{s.name}</span>
            <span className="text-xs text-[var(--text-muted)] ml-auto">Priority {s.priority}</span>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
