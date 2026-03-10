/**
 * Admin agents page. Table + Create agent modal + Agent actions modal.
 */

import { useState, useCallback } from 'react';
import { PageHeader, TableFilters, Button } from '../../../shared/ui';
import { AgentsTable } from '../components/AgentsTable';
import { AgentActionsModal } from '../components/AgentActionsModal';
import { CreateAgentModal } from '../components/CreateAgentModal';
import { toast } from 'sonner';
import { useAdminAgents } from '../hooks';
import type { AdminAgentRow } from '../../../shared/types';

/** Renders admin agents catalog with Create and Actions modals. */
export function AdminAgentsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionsModalAgent, setActionsModalAgent] = useState<AdminAgentRow | null>(null);
  const {
    tenants,
    filteredAgents,
    tenantFilter,
    setTenantFilter,
    statusFilter,
    setStatusFilter,
    deployAgent,
    loadDeployments,
    deploymentsByAgentId,
    deploymentsError,
    selectedDeploymentsAgentId,
    deploymentsLoadingFor,
    deployingAgentId,
    refetch,
  } = useAdminAgents();

  const handleActionsClick = useCallback((agent: AdminAgentRow) => {
    setActionsModalAgent(agent);
  }, []);

  const handleDeployClick = useCallback(
    async (agent: AdminAgentRow) => {
      try {
        await deployAgent(agent);
        toast.success('Deployment queued');
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to deploy agent';
        toast.error(message);
      }
    },
    [deployAgent],
  );

  const selectedDeployments = selectedDeploymentsAgentId
    ? (deploymentsByAgentId[selectedDeploymentsAgentId] ?? [])
    : [];

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-card)] card-glass border border-[var(--border-subtle)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)]/50">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <PageHeader
              title="Agents"
              description="Create, assign, and deploy tenant agent instances"
              className="mb-0"
            />
            <Button type="button" onClick={() => setCreateModalOpen(true)} className="rounded-xl px-5">
              + Add Agent
            </Button>
          </div>

          <TableFilters
            className="mt-5"
            showTenantFilter
            tenants={tenants.map((t) => ({ value: t.id, label: t.name }))}
            selectedTenantId={tenantFilter}
            onTenantChange={setTenantFilter}
            statuses={[
              { value: 'active', label: 'Active' },
              { value: 'paused', label: 'Paused' },
              { value: 'deploying', label: 'Deploying' },
              { value: 'failed', label: 'Failed' },
              { value: 'partially_deployed', label: 'Partially Deployed' },
            ]}
            selectedStatus={statusFilter}
            onStatusChange={setStatusFilter}
          />
        </div>

        <div className="overflow-x-auto overscroll-contain scroll-smooth">
          <AgentsTable
            agents={filteredAgents}
            onActionsClick={handleActionsClick}
            embedded
          />
        </div>
      </div>

      {selectedDeploymentsAgentId && (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Deployments for {selectedDeploymentsAgentId}
            </h3>
            {deploymentsLoadingFor === selectedDeploymentsAgentId && (
              <span className="text-xs text-[var(--text-muted)]">Loading...</span>
            )}
          </div>
          {deploymentsError && (
            <div className="space-y-2">
              <p className="text-xs text-[var(--error)]">{deploymentsError}</p>
              <button
                type="button"
                onClick={() =>
                  selectedDeploymentsAgentId
                    ? loadDeployments(selectedDeploymentsAgentId)
                    : Promise.resolve()
                }
                className="text-xs font-medium text-[var(--ds-primary)] hover:underline"
              >
                Retry
              </button>
            </div>
          )}
          {selectedDeployments.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No deployment records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--text-muted)]">
                    <th className="py-2 pr-4">Channel</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Provider</th>
                    <th className="py-2 pr-4">Retell Agent</th>
                    <th className="py-2 pr-4">Flow</th>
                    <th className="py-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDeployments.map((deployment) => (
                    <tr key={deployment.id} className="border-t border-[var(--border-subtle)]/50">
                      <td className="py-2 pr-4">{deployment.channel}</td>
                      <td className="py-2 pr-4">{deployment.status}</td>
                      <td className="py-2 pr-4">{deployment.provider}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{deployment.retellAgentId ?? '—'}</td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        {deployment.retellConversationFlowId ?? '—'}
                      </td>
                      <td className="py-2">{deployment.error ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <AgentActionsModal
        open={actionsModalAgent !== null}
        onClose={() => setActionsModalAgent(null)}
        agent={actionsModalAgent}
        tenants={tenants}
        onSuccess={() => refetch()}
        onDeploy={handleDeployClick}
        onViewDeployments={async (a) => {
          const deployments = await loadDeployments(a.id);
          if (deployments.length === 0) toast.info('No deployments found for this agent yet');
        }}
        deployingAgentId={deployingAgentId}
      />
      <CreateAgentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          refetch();
          setCreateModalOpen(false);
        }}
      />

    </div>
  );
}
