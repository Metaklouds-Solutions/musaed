/**
 * Admin agents page. Table + Assign agent modal.
 */

import { useState, useCallback } from 'react';
import { PageHeader, Button } from '../../../shared/ui';
import { AgentsTable } from '../components/AgentsTable';
import { AssignAgentModal } from '../components/AssignAgentModal';
import { agentsAdapter } from '../../../adapters/local/agents.adapter';
import { adminAdapter } from '../../../adapters';
import type { AdminAgentRow } from '../../../shared/types';

export function AdminAgentsPage() {
  const [agents, setAgents] = useState<AdminAgentRow[]>(() => agentsAdapter.list());
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AdminAgentRow | null>(null);

  const tenants = adminAdapter.getTenants();

  const refetch = useCallback(() => setAgents(agentsAdapter.list()), []);

  const handleAssignClick = (agent: AdminAgentRow) => {
    if (agent.tenantId) return;
    setSelectedAgent(agent);
    setAssignModalOpen(true);
  };

  const handleAssign = useCallback(
    (tenantId: string) => {
      if (!selectedAgent) return;
      agentsAdapter.assign(selectedAgent.id, tenantId);
      setSelectedAgent(null);
      refetch();
    },
    [selectedAgent, refetch]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description="Retell agent catalog, assign to tenant"
      />

      <AgentsTable agents={agents} onAssignClick={handleAssignClick} />

      <AssignAgentModal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedAgent(null);
        }}
        agent={selectedAgent}
        tenants={tenants}
        onAssign={handleAssign}
      />

    </div>
  );
}
