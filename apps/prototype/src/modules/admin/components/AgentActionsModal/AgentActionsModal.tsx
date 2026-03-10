/**
 * Agent actions modal. Same polished UI as CreateAgentModal.
 * Assign, Deploy, View deployments, View tenant, Unassign.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import {
  Bot,
  Rocket,
  ChevronRight,
  ExternalLink,
  Unlink,
  Layers,
  Pencil,
} from 'lucide-react';
import { Modal, ModalHeader, Button, PopoverSelect } from '../../../../shared/ui';
import { agentsAdapter } from '../../../../adapters';
import type { AdminAgentRow } from '../../../../shared/types';
import type { AdminTenantRow } from '../../../../shared/types';

interface AgentActionsModalProps {
  open: boolean;
  onClose: () => void;
  agent: AdminAgentRow | null;
  tenants: AdminTenantRow[];
  onSuccess: () => void;
  onDeploy: (agent: AdminAgentRow) => Promise<void>;
  onViewDeployments: (agent: AdminAgentRow) => void;
  deployingAgentId: string | null;
}

type Step = 'menu' | 'assign' | 'unassign' | 'edit';

/** Renders agent actions modal with CreateAgentModal-style UI. */
export function AgentActionsModal({
  open,
  onClose,
  agent,
  tenants,
  onSuccess,
  onDeploy,
  onViewDeployments,
  deployingAgentId,
}: AgentActionsModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('menu');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const reset = useCallback(() => {
    setStep('menu');
    setSelectedTenantId('');
    setAssigning(false);
    setUnassigning(false);
    setSavingEdit(false);
  }, []);

  const handleClose = useCallback(() => {
    if (assigning || unassigning || savingEdit) return;
    reset();
    onClose();
  }, [assigning, unassigning, savingEdit, reset, onClose]);

  useEffect(() => {
    if (agent) setEditName(agent.name);
  }, [agent?.id, agent?.name]);

  const handleSaveEdit = useCallback(async () => {
    if (!agent || !editName.trim()) return;
    setSavingEdit(true);
    try {
      await agentsAdapter.updateAgent(agent.id, { name: editName.trim() });
      toast.success('Agent updated');
      onSuccess();
      reset();
      onClose();
    } catch {
      toast.error('Failed to update agent');
    } finally {
      setSavingEdit(false);
    }
  }, [agent, editName, onSuccess, reset, onClose]);

  const handleAssign = useCallback(async () => {
    if (!agent || !selectedTenantId) return;
    setAssigning(true);
    try {
      await agentsAdapter.assign(agent.id, selectedTenantId);
      toast.success('Agent assigned to tenant');
      onSuccess();
      reset();
      onClose();
    } catch {
      toast.error('Failed to assign agent');
    } finally {
      setAssigning(false);
    }
  }, [agent, selectedTenantId, onSuccess, reset, onClose]);

  const handleUnassign = useCallback(async () => {
    if (!agent) return;
    setUnassigning(true);
    try {
      await agentsAdapter.unassign(agent.id);
      toast.success('Agent unassigned');
      onSuccess();
      reset();
      onClose();
    } catch {
      toast.error('Failed to unassign agent');
    } finally {
      setUnassigning(false);
    }
  }, [agent, onSuccess, reset, onClose]);

  const handleDeploy = useCallback(async () => {
    if (!agent) return;
    try {
      await onDeploy(agent);
      onSuccess();
      handleClose();
    } catch {
      // toast handled by parent
    }
  }, [agent, onDeploy, onSuccess, handleClose]);

  const goToAgent = useCallback(() => {
    if (agent?.tenantId) {
      navigate(`/admin/tenants/${agent.tenantId}/agents/${agent.id}`);
    }
    handleClose();
  }, [agent, navigate, handleClose]);

  const goToTenant = useCallback(() => {
    if (agent?.tenantId) {
      navigate(`/admin/tenants/${agent.tenantId}`);
    }
    handleClose();
  }, [agent, navigate, handleClose]);

  if (!agent) return null;

  const isAssigned = Boolean(agent.tenantId);
  const title =
    step === 'menu'
      ? `Actions for ${agent.name}`
      : step === 'assign'
        ? 'Assign to tenant'
        : step === 'edit'
          ? 'Edit agent'
          : 'Unassign agent';

  return (
    <Modal open={open} onClose={handleClose} title={title} maxWidthRem={28}>
      <ModalHeader title={title} onClose={handleClose} />
      <div className="p-5 space-y-4 bg-[var(--bg-subtle)]/35">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(56,189,248,0.14),rgba(124,92,255,0.08))] p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{agent.name}</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {agent.voice} · {isAssigned ? `Linked to ${agent.tenantName ?? agent.tenantId}` : 'Unassigned'}
          </p>
        </div>

        {step === 'menu' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <button
              type="button"
              onClick={() => setStep('edit')}
              className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600">
                  <Pencil className="w-5 h-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Edit agent</p>
                  <p className="text-xs text-[var(--text-muted)]">Change agent name and save</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--ds-primary)] transition-colors" aria-hidden />
            </button>

            {!isAssigned && (
              <button
                type="button"
                onClick={() => setStep('assign')}
                className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]/60 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--ds-primary)]/10 text-[var(--ds-primary)]">
                    <Bot className="w-5 h-5" aria-hidden />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Assign to tenant</p>
                    <p className="text-xs text-[var(--text-muted)]">Link this agent to a tenant</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--ds-primary)] transition-colors" aria-hidden />
              </button>
            )}

            {isAssigned && (
              <>
                <button
                  type="button"
                  onClick={() => handleDeploy()}
                  disabled={deployingAgentId === agent.id}
                  className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]/60 transition-colors text-left group disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600">
                      <Rocket className="w-5 h-5" aria-hidden />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {deployingAgentId === agent.id ? 'Deploying...' : 'Deploy'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">Queue deployment for this agent</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--ds-primary)] transition-colors" aria-hidden />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onViewDeployments(agent);
                    handleClose();
                  }}
                  className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600">
                      <Layers className="w-5 h-5" aria-hidden />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">View deployments</p>
                      <p className="text-xs text-[var(--text-muted)]">See deployment status by channel</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--ds-primary)] transition-colors" aria-hidden />
                </button>

                <button
                  type="button"
                  onClick={() => setStep('unassign')}
                  className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600">
                      <Unlink className="w-5 h-5" aria-hidden />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">Unassign</p>
                      <p className="text-xs text-[var(--text-muted)]">Remove link from tenant</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-orange-500 transition-colors" aria-hidden />
                </button>
              </>
            )}

            {isAssigned && (
              <>
                <button
                  type="button"
                  onClick={goToAgent}
                  className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600">
                      <ExternalLink className="w-5 h-5" aria-hidden />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">View agent</p>
                      <p className="text-xs text-[var(--text-muted)]">Open agent detail page</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--ds-primary)] transition-colors" aria-hidden />
                </button>

                <button
                  type="button"
                  onClick={goToTenant}
                  className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600">
                      <ExternalLink className="w-5 h-5" aria-hidden />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">View tenant</p>
                      <p className="text-xs text-[var(--text-muted)]">Open tenant detail page</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--ds-primary)] transition-colors" aria-hidden />
                </button>
              </>
            )}
          </motion.div>
        )}

        {step === 'assign' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-sm text-[var(--text-muted)]">
              Select a tenant to assign <strong>{agent.name}</strong> to.
            </p>
            <PopoverSelect
              value={selectedTenantId}
              onChange={setSelectedTenantId}
              options={[
                { value: '', label: 'Select tenant' },
                ...tenants.map((t) => ({ value: t.id, label: t.name })),
              ]}
              placeholder="Select tenant"
              aria-label="Select tenant"
            />
            <div className="flex justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('menu')} className="rounded-xl">
                Back
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedTenantId || assigning}
                loading={assigning}
                className="rounded-xl"
              >
                Assign
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'edit' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <label className="block">
              <span className="text-xs text-[var(--text-muted)]">Agent name</span>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)]"
                placeholder="Enter agent name"
              />
            </label>
            <div className="flex justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('menu')} className="rounded-xl">
                Back
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={!editName.trim() || savingEdit}
                loading={savingEdit}
                className="rounded-xl"
              >
                Save
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'unassign' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-sm text-[var(--text-muted)]">
              Unassign <strong>{agent.name}</strong> from {agent.tenantName ?? agent.tenantId}? The agent will become unassigned and can be linked to another tenant.
            </p>
            <div className="flex justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('menu')} className="rounded-xl">
                Back
              </Button>
              <Button
                onClick={handleUnassign}
                loading={unassigning}
                variant="danger"
                className="rounded-xl"
              >
                Unassign
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  );
}
