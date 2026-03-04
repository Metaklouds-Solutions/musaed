/**
 * Agent detail Sync & Webhook tab.
 */

import { motion } from 'motion/react';
import { Webhook } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../../shared/ui';
import type { AgentSyncInfo } from '../../../../shared/types';

interface AgentSyncTabProps {
  syncInfo: AgentSyncInfo;
}

export function AgentSyncTab({ syncInfo }: AgentSyncTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card variant="glass">
        <CardHeader className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Webhook className="w-5 h-5" aria-hidden />
          Sync & Webhook
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Webhook URL</dt>
              <dd className="font-mono text-xs text-[var(--text-secondary)] mt-1 break-all">{syncInfo.webhookUrl || '—'}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Last webhook event</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{syncInfo.lastWebhookEvent || '—'}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Webhook status</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{syncInfo.webhookStatus}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Auto sync</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{syncInfo.autoSync}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>
    </motion.div>
  );
}
