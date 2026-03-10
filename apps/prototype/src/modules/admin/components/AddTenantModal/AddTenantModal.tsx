/**
 * Add Tenant wizard modal. Step 1: Tenant details. Step 2: Select template/channels.
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Modal, ModalHeader, Button } from '../../../../shared/ui';
import { useAdminTenantCreation } from '../../hooks';
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
  onSuccess?: (created: { id: string; name: string; plan: string }) => void;
}

/** Two-step wizard: tenant details -> template/channels. Creates tenant via adapter. */
export function AddTenantModal({ open, onClose, onSuccess }: AddTenantModalProps) {
  const [step, setStep] = useState(1);
  const [clinicData, setClinicData] = useState<ClinicInfoData>(INITIAL_CLINIC);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<Array<'voice' | 'chat' | 'email'>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    templates,
    templatesLoading,
    templatesError,
    refetchTemplates,
    createTenant,
  } = useAdminTenantCreation();

  const reset = useCallback(() => {
    setStep(1);
    setClinicData(INITIAL_CLINIC);
    setSelectedTemplateId(null);
    setSelectedChannels([]);
    setIsSubmitting(false);
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

  const handleComplete = useCallback(async () => {
      setIsSubmitting(true);
      try {
        const result = await createTenant({
          name: clinicData.name.trim(),
          plan: clinicData.plan,
          ownerEmail: clinicData.ownerEmail.trim(),
          ownerName: clinicData.ownerName.trim() || undefined,
          phone: clinicData.phone.trim() || undefined,
          address: clinicData.address.trim() || undefined,
          timezone: clinicData.timezone,
          locale: clinicData.locale,
          templateId: selectedTemplateId ?? undefined,
          channelsEnabled: selectedTemplateId ? selectedChannels : undefined,
        });
        reset();
        onClose();
        onSuccess?.({ id: result.id, name: result.name, plan: result.plan });
        toast.success('Tenant created successfully');
        if (result.inviteSetupUrl) {
          navigator.clipboard.writeText(result.inviteSetupUrl).catch(() => {});
          toast.info('Invite link copied to clipboard. Paste it in your browser (e.g. for TempMail).', {
            duration: 8000,
          });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create tenant';
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    }, [clinicData, createTenant, onClose, onSuccess, reset, selectedChannels, selectedTemplateId]);

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      setSelectedTemplateId(templateId);
      const template = templates.find((item) => item.id === templateId);
      setSelectedChannels(template ? [...template.channels] : []);
    },
    [templates],
  );

  const handleToggleChannel = useCallback((channel: 'voice' | 'chat' | 'email') => {
    setSelectedChannels((current) => {
      if (current.includes(channel)) {
        return current.filter((item) => item !== channel);
      }
      return [...current, channel];
    });
  }, []);

  return (
    <Modal open={open} onClose={handleClose} title="Onboard Tenant" maxWidthRem={52}>
      <ModalHeader title="Onboard Tenant" onClose={handleClose} />
      <div className="p-5 md:p-6 space-y-6 bg-[var(--bg-subtle)]/35">
        <div className="rounded-2xl border border-[var(--border-subtle)]/80 bg-[linear-gradient(180deg,rgba(124,92,255,0.12),rgba(16,185,129,0.05))] p-4">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Create Tenant Workspace</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Complete tenant profile and optionally create an agent from a template during onboarding.
          </p>
        </div>
        <TenantWizardProgress currentStep={step} />

        {step === 1 && (
          <>
            <TenantWizardStep1ClinicInfo data={clinicData} onChange={setClinicData} />
            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--separator)]">
              <Button type="button" variant="secondary" onClick={handleClose} className="rounded-xl px-5">
                Cancel
              </Button>
              <Button onClick={handleStep1Next} disabled={!canProceedStep1} className="rounded-xl px-5">
                Next: Select Template
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <TenantWizardStep2DeployAgent
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              selectedChannels={selectedChannels}
              onSelectTemplate={handleTemplateSelect}
              onToggleChannel={handleToggleChannel}
              onContinue={handleComplete}
              onSkip={handleComplete}
              isSubmitting={isSubmitting || templatesLoading}
              isLoading={templatesLoading}
              loadError={templatesError?.message ?? null}
              onRetryLoad={refetchTemplates}
            />
            <div className="flex justify-between pt-4 border-t border-[var(--separator)]">
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
