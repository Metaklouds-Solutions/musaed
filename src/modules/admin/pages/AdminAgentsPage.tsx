/**
 * Admin agents page. Table + Assign agent modal.
 */

import { useState, useCallback, useMemo } from 'react';
import { PageHeader, TableFilters } from '../../../shared/ui';
import { AgentsTable } from '../components/AgentsTable';
import { AssignAgentModal } from '../components/AssignAgentModal';
import { toast } from 'sonner';
import { adminAdapter, agentsAdapter, auditAdapter } from '../../../adapters';
import type { AdminAgentRow } from '../../../shared/types';

export function AdminAgentsPage() {
  const [agents, setAgents] = useState<AdminAgentRow[]>(() => agentsAdapter.list());
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AdminAgentRow | null>(null);
  const [tenantFilter, setTenantFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const tenants = adminAdapter.getTenants();

  const filteredAgents = useMemo(() => {
    let list = agents;
    if (tenantFilter) list = list.filter((a) => a.tenantId === tenantFilter);
    if (statusFilter) list = list.filter((a) => a.status === statusFilter);
    return list;
  }, [agents, tenantFilter, statusFilter]);

  const refetch = useCallback(() => setAgents(agentsAdapter.list()), []);

  const handleAssignClick = (agent: AdminAgentRow) => {
    if (agent.tenantId) return;
    setSelectedAgent(agent);
    setAssignModalOpen(true);
  };

  const handleAssign = useCallback(
    (tenantId: string) => {
      if (!selectedAgent) return;
      try {
        agentsAdapter.assign(selectedAgent.id, tenantId);
        auditAdapter.log('agent.assigned', { agentId: selectedAgent.id, agentName: selectedAgent.name, tenantId });
        setSelectedAgent(null);
        refetch();
        toast.success('Agent assigned to tenant');
      } catch {
        toast.error('Failed to assign agent');
      }
    },
    [selectedAgent, refetch]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description="Retell agent catalog, assign to tenant"
      />

      <TableFilters
        showTenantFilter
        tenants={tenants.map((t) => ({ value: t.id, label: t.name }))}
        selectedTenantId={tenantFilter}
        onTenantChange={setTenantFilter}
        statuses={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
        selectedStatus={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <AgentsTable agents={filteredAgents} onAssignClick={handleAssignClick} />

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
