/**
 * Agent detail Overview tab: identity, channels, sync status.
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bot, Phone, MessageSquare, Mail, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardBody, Badge } from '../../../../shared/ui';
import type { AgentDetailFull } from '../../../../shared/types';

const channelIcons: Record<string, typeof Phone> = { voice: Phone, chat: MessageSquare, email: Mail };

interface AgentOverviewTabProps {
  agent: AgentDetailFull;
}

export function AgentOverviewTab({ agent }: AgentOverviewTabProps) {
  const Icon = channelIcons[agent.channel] ?? Bot;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
      <Card variant="glass">
        <CardHeader className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Icon className="w-5 h-5" aria-hidden />
          Identity
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Name</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{agent.name}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Retell Agent ID</dt>
              <dd className="font-mono text-xs text-[var(--text-secondary)] mt-1">{agent.retellAgentId}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Channel</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1 capitalize">{agent.channel}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Tenant</dt>
              <dd className="mt-1">
                <Link to={`/tenants/${agent.tenantId}`} className="font-medium text-[var(--ds-primary)] hover:underline">
                  {agent.tenantName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Created</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{agent.createdAt}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Sync status</dt>
              <dd className="mt-1">
                <Badge status={agent.syncStatus === 'In Sync' ? 'active' : 'pending'}>{agent.syncStatus}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Last synced</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{agent.lastSynced}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card variant="glass">
        <CardHeader className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <RefreshCw className="w-5 h-5" aria-hidden />
          Voice config
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Voice</dt>
              <dd className="font-medium text-[var(--text-primary)]">{agent.voiceConfig.voiceName}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Gender</dt>
              <dd className="font-medium text-[var(--text-primary)]">{agent.voiceConfig.gender || '—'}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Accent</dt>
              <dd className="font-medium text-[var(--text-primary)]">{agent.voiceConfig.accent || '—'}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Interruption sensitivity</dt>
              <dd className="font-medium text-[var(--text-primary)]">{agent.voiceConfig.interruptionSensitivity}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      {agent.chatConfig.status !== 'Not Configured' && (
        <Card variant="glass">
          <CardHeader className="text-base font-semibold text-[var(--text-primary)]">Chat config</CardHeader>
          <CardBody>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[var(--text-muted)]">Status</dt>
                <dd className="font-medium text-[var(--text-primary)]">{agent.chatConfig.status}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Channel</dt>
                <dd className="font-medium text-[var(--text-primary)]">{agent.chatConfig.channel}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Languages</dt>
                <dd className="font-medium text-[var(--text-primary)]">{agent.chatConfig.languages?.join(', ') || '—'}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      )}
    </motion.div>
  );
}
