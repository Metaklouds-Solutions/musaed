/**
 * Agent sync status: last synced timestamp.
 */

import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import type { TenantAgentDetail } from '../../../../shared/types';

interface AgentSyncStatusProps {
  agent: TenantAgentDetail | null;
}

function formatRelativeTime(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} mins ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  return `${Math.floor(sec / 86400)} days ago`;
}

export function AgentSyncStatus({ agent }: AgentSyncStatusProps) {
  if (!agent) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="rounded-[var(--radius-card)] card-glass p-5"
    >
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Sync Status</h2>
      <div className="flex items-center gap-3">
        <RefreshCw className="w-5 h-5 text-[var(--text-muted)]" aria-hidden />
        <div>
          <p className="font-medium text-[var(--text-primary)]">
            Last synced: {formatRelativeTime(agent.lastSyncedAt)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {new Date(agent.lastSyncedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
