/**
 * Tenant agent overview page. Status, skills, sync, A/B testing.
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PageHeader, EmptyState } from '../../../shared/ui';
import { Bot } from 'lucide-react';
import { AgentStatusCard } from '../components/AgentStatusCard';
import { AgentSkillsPanel } from '../components/AgentSkillsPanel';
import { AgentSyncStatus } from '../components/AgentSyncStatus';
import { AgentABTestSection } from '../components/AgentABTestSection/AgentABTestSection';
import { abTestAdapter } from '../../../adapters';
import { useAgent } from '../hooks';

export function AgentPage() {
  const { agent, tenantId } = useAgent();
  const [abConfig, setAbConfig] = useState(() =>
    tenantId ? abTestAdapter.getConfig(tenantId) : { enabled: false, splitPercentA: 50, versionALabel: 'Version A', versionBLabel: 'Version B' }
  );

  useEffect(() => {
    if (tenantId) setAbConfig(abTestAdapter.getConfig(tenantId));
  }, [tenantId]);

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agent" description="Agent overview" />
        <EmptyState
          icon={Bot}
          title="Sign in as tenant"
          description="Select a tenant role on the login page to view your agent."
        />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agent" description="Agent overview" />
        <div className="rounded-[var(--radius-card)] card-glass p-8 text-center">
          <Bot className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" aria-hidden />
          <p className="text-[var(--text-primary)] font-medium">No agent assigned yet</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Contact your admin to deploy an agent to your clinic.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Agent Overview"
          description="Voice agent status, skills, and sync"
        />
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <AgentStatusCard agent={agent} />
        <AgentSyncStatus agent={agent} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <AgentSkillsPanel agent={agent} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.12 }}
      >
        <AgentABTestSection tenantId={tenantId} config={abConfig} onChange={setAbConfig} />
      </motion.div>
    </div>
  );
}
