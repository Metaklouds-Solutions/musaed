/**
 * Add Tenant wizard modal. Step 1: Tenant details. Step 2: Assign existing agent.
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal, ModalHeader, Button } from '../../../../shared/ui';
import { useAdminTenantCreation } from '../../hooks';
import {
  TenantWizardProgress,
  TenantWizardStep1ClinicInfo,
  TenantWizardStep2DeployAgent,
  type ClinicInfoData,
} from '../TenantWizard';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_CLINIC: ClinicInfoData = {
  name: '',
  plan: 'PRO',
  ownerEmail: '',
  ownerName: '',
  phone: '',
  address: '',
  timezone: 'America/New_York',
  locale: 'en-US',
};

interface AddTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (created: { id: string; name: string; plan: string }) => void;
}

/** Two-step wizard: tenant details -> template/channels. Creates tenant via adapter. */
export function AddTenantModal({ open, onClose, onSuccess }: AddTenantModalProps) {
  const [step, setStep] = useState(1);
  const [clinicData, setClinicData] = useState<ClinicInfoData>(INITIAL_CLINIC);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    assignableAgents,
    assignableAgentsLoading,
    assignableAgentsError,
    refetchAssignableAgents,
    createTenant,
    assignAgentToTenant,
  } = useAdminTenantCreation();

  const reset = useCallback(() => {
    setStep(1);
    setClinicData(INITIAL_CLINIC);
    setSelectedAgentId(null);
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const normalizedOwnerEmail = clinicData.ownerEmail.trim().toLowerCase();
  const isOwnerEmailValid = EMAIL_REGEX.test(normalizedOwnerEmail);
  const canProceedStep1 = clinicData.name.trim() && isOwnerEmailValid;

  const handleStep1Next = useCallback(() => {
    if (!canProceedStep1) return;
    setStep(2);
  }, [canProceedStep1]);

  useEffect(() => {
    if (!open || step !== 2) return;
    refetchAssignableAgents();
  }, [open, refetchAssignableAgents, step]);

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const result = await createTenant({
        name: clinicData.name.trim(),
        plan: clinicData.plan,
        ownerEmail: normalizedOwnerEmail,
        ownerName: clinicData.ownerName.trim() || undefined,
        phone: clinicData.phone.trim() || undefined,
        address: clinicData.address.trim() || undefined,
        timezone: clinicData.timezone,
        locale: clinicData.locale,
      });
      if (selectedAgentId) {
        try {
          await assignAgentToTenant(selectedAgentId, result.id);
          refetchAssignableAgents();
        } catch (assignErr: unknown) {
          const msg = assignErr instanceof Error ? assignErr.message : String(assignErr);
          if (msg.includes('already assigned') || msg.includes('409')) {
            toast.warning('Tenant created. Agent is already assigned to another tenant — assign from Agents later.');
          } else {
            toast.error(msg);
          }
        }
      }
      reset();
      onClose();
      onSuccess?.({ id: result.id, name: result.name, plan: result.plan });
      toast.success('Tenant created successfully');
      if (result.inviteSetupUrl) {
        navigator.clipboard.writeText(result.inviteSetupUrl).catch(() => {});
        toast.info('Invite link copied to clipboard. Check your email (and spam) or paste the link in your browser.', {
          duration: 8000,
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create tenant';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [assignAgentToTenant, clinicData, createTenant, normalizedOwnerEmail, onClose, onSuccess, refetchAssignableAgents, reset, selectedAgentId]);

  return (
    <Modal open={open} onClose={handleClose} title="Onboard Tenant" maxWidthRem={42}>
      <ModalHeader title="Onboard Tenant" onClose={handleClose} />
      <div className="max-h-[min(74dvh,40rem)] overflow-y-auto p-3 sm:p-4 md:p-5 space-y-4 bg-[var(--bg-subtle)]/35">
        <div className="rounded-2xl border border-[var(--border-subtle)]/80 bg-[linear-gradient(180deg,rgba(124,92,255,0.12),rgba(16,185,129,0.05))] p-3.5">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Create Tenant Workspace</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Complete tenant profile and optionally assign an existing agent.
          </p>
        </div>
        <TenantWizardProgress currentStep={step} />

        {step === 1 && (
          <>
            <TenantWizardStep1ClinicInfo data={clinicData} onChange={setClinicData} />
            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--separator)]">
              <Button type="button" variant="secondary" onClick={handleClose} className="rounded-xl px-5">
                Cancel
              </Button>
              <Button onClick={handleStep1Next} disabled={!canProceedStep1} className="rounded-xl px-5">
                Next: Assign Agent
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <TenantWizardStep2DeployAgent
              agents={assignableAgents}
              selectedAgentId={selectedAgentId}
              onSelectAgent={setSelectedAgentId}
              onContinue={handleComplete}
              onSkip={handleComplete}
              isSubmitting={isSubmitting || assignableAgentsLoading}
              isLoading={assignableAgentsLoading}
              loadError={assignableAgentsError?.message ?? null}
              onRetryLoad={refetchAssignableAgents}
            />
            <div className="flex justify-between pt-3 border-t border-[var(--separator)]">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} className="rounded-xl px-5">
                Back
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
