/**
 * Add Tenant wizard modal. Step 1: Clinic info. Step 2: Deploy agent.
 * Uses adapters only (tenantsAdapter, auditAdapter).
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Modal, ModalHeader, Button } from '../../../../shared/ui';
import { tenantsAdapter, auditAdapter } from '../../../../adapters';
import {
  TenantWizardProgress,
  TenantWizardStep1ClinicInfo,
  TenantWizardStep2DeployAgent,
  type ClinicInfoData,
} from '../TenantWizard';

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
  onSuccess?: () => void;
}

/** Two-step wizard: clinic info → deploy agent. Creates tenant via adapter. */
export function AddTenantModal({ open, onClose, onSuccess }: AddTenantModalProps) {
  const [step, setStep] = useState(1);
  const [clinicData, setClinicData] = useState<ClinicInfoData>(INITIAL_CLINIC);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const platformAgents = tenantsAdapter.getPlatformAgents();

  const reset = useCallback(() => {
    setStep(1);
    setClinicData(INITIAL_CLINIC);
    setSelectedAgentId(null);
    setIsDeploying(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const canProceedStep1 = clinicData.name.trim() && clinicData.ownerEmail.trim();

  const handleStep1Next = useCallback(() => {
    if (!canProceedStep1) return;
    setStep(2);
  }, [canProceedStep1]);

  const handleComplete = useCallback(
    (agentId?: string) => {
      setIsDeploying(true);
      try {
        const tenant = tenantsAdapter.createTenant({
          name: clinicData.name.trim(),
          plan: clinicData.plan,
          ownerEmail: clinicData.ownerEmail.trim(),
          ownerName: clinicData.ownerName.trim() || undefined,
          phone: clinicData.phone.trim() || undefined,
          address: clinicData.address.trim() || undefined,
          timezone: clinicData.timezone,
          locale: clinicData.locale,
          agentId,
        });
        auditAdapter.log('tenant.created', { tenantId: tenant.id, name: tenant.name, plan: tenant.plan });
        reset();
        onClose();
        onSuccess?.();
        toast.success('Tenant created successfully');
      } catch {
        toast.error('Failed to create tenant');
      } finally {
        setIsDeploying(false);
      }
    },
    [clinicData, reset, onClose, onSuccess]
  );

  const handleDeploy = useCallback(() => handleComplete(selectedAgentId ?? undefined), [handleComplete, selectedAgentId]);

  return (
    <Modal open={open} onClose={handleClose} title="Add Tenant" maxWidthRem={28}>
      <ModalHeader title="Add Tenant" onClose={handleClose} />
      <div className="p-5 space-y-6 bg-[var(--bg-subtle)]/30">
        <TenantWizardProgress currentStep={step} />

        {step === 1 && (
          <>
            <TenantWizardStep1ClinicInfo data={clinicData} onChange={setClinicData} />
            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--separator)]">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleStep1Next} disabled={!canProceedStep1}>
                Next: Deploy Agent
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <TenantWizardStep2DeployAgent
              agents={platformAgents}
              selectedId={selectedAgentId}
              onSelect={setSelectedAgentId}
              onDeploy={handleDeploy}
              onSkip={() => handleComplete()}
              isDeploying={isDeploying}
            />
            <div className="flex justify-between pt-4 border-t border-[var(--separator)]">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
