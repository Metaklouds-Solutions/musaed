/**
 * Admin agents page. Table + Assign agent modal.
 */

import { useState, useCallback } from 'react';
import { PageHeader, TableFilters } from '../../../shared/ui';
import { AgentsTable } from '../components/AgentsTable';
import { AssignAgentModal } from '../components/AssignAgentModal';
import { toast } from 'sonner';
import { useAdminAgents } from '../hooks';
import type { AdminAgentRow } from '../../../shared/types';

/** Renders admin agents catalog with tenant assignment flow and table filters. */
export function AdminAgentsPage() {
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AdminAgentRow | null>(null);
  const {
    tenants,
    filteredAgents,
    tenantFilter,
    setTenantFilter,
    statusFilter,
    setStatusFilter,
    assignAgent,
  } = useAdminAgents();

  const handleAssignClick = (agent: AdminAgentRow) => {
    if (agent.tenantId) return;
    setSelectedAgent(agent);
    setAssignModalOpen(true);
  };

  const handleAssign = useCallback(
    (tenantId: string) => {
      if (!selectedAgent) return;
      try {
        assignAgent(selectedAgent, tenantId);
        setSelectedAgent(null);
        toast.success('Agent assigned to tenant');
      } catch {
        toast.error('Failed to assign agent');
      }
    },
    [selectedAgent, assignAgent]
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
