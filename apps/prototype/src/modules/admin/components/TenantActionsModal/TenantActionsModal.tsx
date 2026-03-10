/**
 * Tenant actions modal: Assign agents, change name, enable/disable, delete.
 * Single entry point for all per-tenant actions.
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import {
  Bot,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Modal, ModalHeader, Button, PopoverSelect } from '../../../../shared/ui';
import { agentsAdapter, tenantsAdapter } from '../../../../adapters';
import type { TenantListRow } from '../../../../shared/types';
import type { AdminAgentRow } from '../../../../shared/types';

interface TenantActionsModalProps {
  open: boolean;
  onClose: () => void;
  tenant: TenantListRow | null;
  onSuccess: () => void;
}

type Step = 'menu' | 'assign' | 'rename' | 'enable-disable' | 'delete';

const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] focus:border-transparent';

/** Renders tenant actions modal with step-based UI. */
export function TenantActionsModal({
  open,
  onClose,
  tenant,
  onSuccess,
}: TenantActionsModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('menu');
  const [unassignedAgents, setUnassignedAgents] = useState<AdminAgentRow[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reset = useCallback(() => {
    setStep('menu');
    setSelectedAgentId('');
    setAssigning(false);
    setSavingName(false);
    setTogglingStatus(false);
    setDeleting(false);
  }, []);

  const handleClose = useCallback(() => {
    if (assigning || savingName || togglingStatus || deleting) return;
    reset();
    onClose();
  }, [assigning, savingName, togglingStatus, deleting, reset, onClose]);

  useEffect(() => {
    if (tenant) setEditName(tenant.name);
  }, [tenant?.id, tenant?.name]);

  useEffect(() => {
    if (!open || !tenant) return;
    if (step === 'assign') {
      setAgentsLoading(true);
      agentsAdapter
        .list()
        .then((all) => setUnassignedAgents(all.filter((a) => !a.tenantId)))
        .finally(() => setAgentsLoading(false));
    }
  }, [open, tenant?.id, step]);

  const handleAssign = useCallback(async () => {
    if (!tenant || !selectedAgentId) return;
    setAssigning(true);
    try {
      await agentsAdapter.assign(selectedAgentId, tenant.id);
      toast.success('Agent assigned');
      onSuccess();
      reset();
      onClose();
    } catch {
      toast.error('Failed to assign agent');
    } finally {
      setAssigning(false);
    }
  }, [tenant, selectedAgentId, onSuccess, reset, onClose]);

  const handleSaveName = useCallback(async () => {
    if (!tenant || !editName.trim()) return;
    setSavingName(true);
    try {
      await tenantsAdapter.updateTenant(tenant.id, { name: editName.trim() });
      toast.success('Tenant name updated');
      onSuccess();
      reset();
      onClose();
    } catch {
      toast.error('Failed to update tenant');
    } finally {
      setSavingName(false);
    }
  }, [tenant, editName, onSuccess, reset, onClose]);

  const handleToggleStatus = useCallback(async () => {
    if (!tenant) return;
    const isSuspended = tenant.status === 'SUSPENDED';
    setTogglingStatus(true);
    try {
      const fn = isSuspended ? tenantsAdapter.enableTenant : tenantsAdapter.disableTenant;
      await fn(tenant.id);
      toast.success(isSuspended ? 'Tenant enabled' : 'Tenant disabled');
      onSuccess();
      reset();
      onClose();
    } catch {
      toast.error(`Failed to ${isSuspended ? 'enable' : 'disable'} tenant`);
    } finally {
      setTogglingStatus(false);
    }
  }, [tenant, onSuccess, reset, onClose]);

  const handleDelete = useCallback(async () => {
    if (!tenant) return;
    setDeleting(true);
    try {
      await tenantsAdapter.deleteTenant(tenant.id);
      toast.success('Tenant deleted');
      onSuccess();
      reset();
      onClose();
    } catch {
      toast.error('Failed to delete tenant');
    } finally {
      setDeleting(false);
    }
  }, [tenant, onSuccess, reset, onClose]);

  const goToTenantDetail = useCallback(() => {
    if (tenant) {
      navigate(`/admin/tenants/${tenant.id}`);
      handleClose();
    }
  }, [tenant, navigate, handleClose]);

  if (!tenant) return null;

  const isSuspended = tenant.status === 'SUSPENDED';
  const title =
    step === 'menu'
      ? `Actions for ${tenant.name}`
      : step === 'assign'
        ? 'Assign agent'
        : step === 'rename'
          ? 'Change tenant name'
          : step === 'enable-disable'
            ? isSuspended ? 'Enable tenant' : 'Disable tenant'
            : 'Delete tenant';

  return (
    <Modal open={open} onClose={handleClose} title={title} maxWidthRem={28}>
      <ModalHeader title={title} onClose={handleClose} />
      <div className="p-5 space-y-4">
        {step === 'menu' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
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
                  <p className="font-medium text-[var(--text-primary)]">Assign agent</p>
                  <p className="text-xs text-[var(--text-muted)]">Add an unassigned agent to this tenant</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--ds-primary)] transition-colors" aria-hidden />
            </button>

            <button
              type="button"
              onClick={() => setStep('rename')}
              className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600">
                  <Pencil className="w-5 h-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Change name</p>
                  <p className="text-xs text-[var(--text-muted)]">Update tenant display name</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--ds-primary)] transition-colors" aria-hidden />
            </button>

            <button
              type="button"
              onClick={() => setStep('enable-disable')}
              className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${isSuspended ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}`}>
                  {isSuspended ? <Power className="w-5 h-5" aria-hidden /> : <PowerOff className="w-5 h-5" aria-hidden />}
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {isSuspended ? 'Enable tenant' : 'Disable tenant'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {isSuspended ? 'Allow tenant to log in again' : 'Disable tenant access'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--ds-primary)] transition-colors" aria-hidden />
            </button>

            <button
              type="button"
              onClick={goToTenantDetail}
              className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]/60 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600">
                  <ExternalLink className="w-5 h-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">View tenant</p>
                  <p className="text-xs text-[var(--text-muted)]">Open tenant detail page</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--ds-primary)] transition-colors" aria-hidden />
            </button>

            <button
              type="button"
              onClick={() => setStep('delete')}
              className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 text-red-600">
                  <Trash2 className="w-5 h-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Delete tenant</p>
                  <p className="text-xs text-[var(--text-muted)]">Permanently remove tenant</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-red-500 transition-colors" aria-hidden />
            </button>
          </motion.div>
        )}

        {step === 'assign' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-sm text-[var(--text-muted)]">
              Select an unassigned agent to assign to <strong>{tenant.name}</strong>.
            </p>
            {agentsLoading ? (
              <p className="text-sm text-[var(--text-muted)] py-4">Loading agents…</p>
            ) : unassignedAgents.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4">No unassigned agents available.</p>
            ) : (
              <PopoverSelect
                value={selectedAgentId}
                onChange={setSelectedAgentId}
                options={[
                  { value: '', label: 'Select agent' },
                  ...unassignedAgents.map((a) => ({ value: a.id, label: `${a.name} (${a.voice})` })),
                ]}
                placeholder="Select agent"
                aria-label="Select agent"
              />
            )}
            <div className="flex justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('menu')} className="rounded-xl">
                Back
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedAgentId || assigning}
                loading={assigning}
                className="rounded-xl"
              >
                Assign
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'rename' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <label className="block">
              <span className="text-xs text-[var(--text-muted)]">Tenant name</span>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={`${inputClass} mt-1.5`}
                placeholder="Enter tenant name"
              />
            </label>
            <div className="flex justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('menu')} className="rounded-xl">
                Back
              </Button>
              <Button
                onClick={handleSaveName}
                disabled={!editName.trim() || savingName}
                loading={savingName}
                className="rounded-xl"
              >
                Save
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'enable-disable' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-sm text-[var(--text-muted)]">
              {isSuspended
                ? `${tenant.name} is currently suspended. Enable to allow them to log in again.`
                : `${tenant.name} is active. Disable to revoke access.`}
            </p>
            <div className="flex justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('menu')} className="rounded-xl">
                Back
              </Button>
              <Button
                onClick={handleToggleStatus}
                loading={togglingStatus}
                variant={isSuspended ? 'primary' : 'danger'}
                className="rounded-xl"
              >
                {isSuspended ? 'Enable tenant' : 'Disable tenant'}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'delete' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-sm text-[var(--text-muted)]">
              Are you sure you want to delete <strong>{tenant.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep('menu')} className="rounded-xl">
                Back
              </Button>
              <Button
                onClick={handleDelete}
                loading={deleting}
                variant="danger"
                className="rounded-xl"
              >
                Delete tenant
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Modal>
  );
}
