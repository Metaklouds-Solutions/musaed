import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Bot, CircleCheck, Cog, KeyRound, Rocket } from 'lucide-react';
import { Button, Modal, ModalHeader } from '../../../../shared/ui';
import { useAdminAgentCreation } from '../../hooks';

type AgentChannel = 'voice' | 'chat' | 'email';
type AgentType = 'product' | 'custom';

interface CreateAgentModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const STEPS = [
  { label: 'Type', icon: Bot },
  { label: 'Configure', icon: Cog },
  { label: 'Credentials', icon: KeyRound },
  { label: 'Review', icon: Rocket },
];

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] text-sm';

/** Renders step-based agent creation modal for admin page with tenant assignment. */
export function CreateAgentModal({ open, onClose, onCreated }: CreateAgentModalProps) {
  const [step, setStep] = useState(1);
  const [agentType, setAgentType] = useState<AgentType>('product');
  const [templateId, setTemplateId] = useState<string>('');
  const [name, setName] = useState('');
  const [channelsEnabled, setChannelsEnabled] = useState<AgentChannel[]>(['voice']);
  const [capabilityLevel, setCapabilityLevel] = useState('L1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { templates, templatesLoading, templatesError, refetchTemplates, createAgent } =
    useAdminAgentCreation();

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) ?? null,
    [templateId, templates],
  );

  const canContinue = useMemo(() => {
    if (step === 1) return templateId.length > 0;
    if (step === 2) return name.trim().length > 0 && channelsEnabled.length > 0;
    return true;
  }, [channelsEnabled.length, name, step, templateId]);

  function resetState(): void {
    setStep(1);
    setAgentType('product');
    setTemplateId('');
    setName('');
    setChannelsEnabled(['voice']);
    setCapabilityLevel('L1');
    setIsSubmitting(false);
  }

  function handleClose(): void {
    if (isSubmitting) return;
    resetState();
    onClose();
  }

  function toggleChannel(channel: AgentChannel): void {
    setChannelsEnabled((prev) => {
      if (prev.includes(channel)) {
        if (prev.length === 1) return prev;
        return prev.filter((value) => value !== channel);
      }
      return [...prev, channel];
    });
  }

  const handleTemplateSelect = useCallback((nextTemplateId: string): void => {
    setTemplateId(nextTemplateId);
    const template = templates.find((item) => item.id === nextTemplateId);
    if (!template) return;
    setChannelsEnabled(template.channels.length > 0 ? template.channels : ['chat']);
    setCapabilityLevel(template.capabilityLevel);
    if (name.trim().length === 0) {
      setName(template.name);
    }
  }, [name, templates]);

  useEffect(() => {
    if (!open || step !== 1) return;
    if (templateId.length > 0) return;
    if (templatesLoading) return;
    const firstTemplate = templates[0];
    if (!firstTemplate) return;
    handleTemplateSelect(firstTemplate.id);
  }, [handleTemplateSelect, open, step, templateId, templates, templatesLoading]);

  async function handleSubmit(): Promise<void> {
    if (!selectedTemplate || !canContinue) return;
    setIsSubmitting(true);
    try {
      await createAgent({
        templateId: selectedTemplate.id,
        name: name.trim(),
        channelsEnabled,
        capabilityLevel: capabilityLevel.trim() || undefined,
      });
      toast.success('Agent created. Assign it to a tenant during onboarding to deploy.');
      resetState();
      onClose();
      onCreated?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create agent';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create Agent" maxWidthRem={56}>
      <ModalHeader title="Onboard Agent" onClose={handleClose} />
      <div className="p-5 md:p-6 space-y-5 bg-[var(--bg-subtle)]/35">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(56,189,248,0.14),rgba(124,92,255,0.08))] p-4">
          <p className="text-base font-semibold text-[var(--text-primary)]">Create Platform Agent</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Create an unassigned agent first, then assign it from tenant onboarding.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)]/80 bg-[var(--bg-elevated)]/40 px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            {STEPS.map((stepItem, index) => {
              const stepNumber = index + 1;
              const done = step > stepNumber;
              const active = step === stepNumber;
              const Icon = stepItem.icon;
              return (
                <div key={stepItem.label} className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      done
                        ? 'bg-[var(--success)] text-white'
                        : active
                          ? 'bg-[linear-gradient(135deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)] text-white'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {done ? <CircleCheck className="w-4 h-4" aria-hidden /> : <Icon className="w-4 h-4" aria-hidden />}
                  </div>
                  <span className={active ? 'text-sm font-semibold text-[var(--text-primary)]' : 'text-sm text-[var(--text-muted)]'}>
                    {stepItem.label}
                  </span>
                  {index < STEPS.length - 1 && <div className="w-6 h-0.5 rounded bg-[var(--border-subtle)]" aria-hidden />}
                </div>
              );
            })}
          </div>
        </div>

        {step === 1 && (
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-4 space-y-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">What type of agent?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAgentType('product')}
                className={`rounded-xl border px-4 py-3 text-left ${agentType === 'product' ? 'border-[var(--ds-primary)] bg-[rgba(124,92,255,0.1)]' : 'border-[var(--border-subtle)] bg-[var(--bg-base)]'}`}
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">Product Agent</p>
                <p className="text-xs text-[var(--text-muted)]">Use a pre-built platform template.</p>
              </button>
              <button
                type="button"
                onClick={() => setAgentType('custom')}
                className={`rounded-xl border px-4 py-3 text-left ${agentType === 'custom' ? 'border-[var(--ds-primary)] bg-[rgba(124,92,255,0.1)]' : 'border-[var(--border-subtle)] bg-[var(--bg-base)]'}`}
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">Custom Agent</p>
                <p className="text-xs text-[var(--text-muted)]">Start from template and customize in next step.</p>
              </button>
            </div>
            {templatesLoading && <p className="text-sm text-[var(--text-muted)]">Loading templates...</p>}
            {templatesError && (
              <div className="rounded-xl border border-[var(--error)]/50 bg-[rgba(239,68,68,0.08)] p-3">
                <p className="text-sm text-[var(--text-primary)]">Failed to load templates.</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{templatesError.message}</p>
                <Button variant="secondary" onClick={refetchTemplates} className="mt-2 rounded-xl">
                  Retry
                </Button>
              </div>
            )}
            {!templatesLoading && !templatesError && templates.length === 0 && (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3">
                <p className="text-sm text-[var(--text-primary)]">No templates available.</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Import or create at least one template in Admin Templates before creating an agent.
                </p>
              </div>
            )}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {templates.map((template) => {
                const selected = template.id === templateId;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left ${
                      selected
                        ? 'border-[var(--ds-primary)] bg-[rgba(124,92,255,0.1)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-base)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{template.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Channels: {template.channels.join(' + ')} | Capability: {template.capabilityLevel}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-4 space-y-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Configure agent</p>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">Agent Name *</label>
              <input
                className={inputClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="My Custom Agent"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">Capability Level</label>
              <input
                className={inputClass}
                value={capabilityLevel}
                onChange={(event) => setCapabilityLevel(event.target.value)}
                placeholder="L1"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-2">Channels *</label>
              <div className="flex flex-wrap gap-2">
                {(['voice', 'chat', 'email'] as AgentChannel[]).map((channel) => {
                  const checked = channelsEnabled.includes(channel);
                  return (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => toggleChannel(channel)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                        checked
                          ? 'border-[var(--ds-primary)] bg-[rgba(124,92,255,0.12)] text-[var(--text-primary)]'
                          : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                      }`}
                    >
                      {channel}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-4 space-y-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Credentials</p>
            <p className="text-sm text-[var(--text-muted)]">
              External credentials are managed after deployment from integrations settings.
            </p>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3">
              <p className="text-xs text-[var(--text-muted)]">
                This step is informational in the current release and does not block deployment.
              </p>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-4 space-y-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Review & Create</p>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 text-sm space-y-1">
              <p className="text-[var(--text-primary)]">Tenant: Unassigned</p>
              <p className="text-[var(--text-muted)]">Template: {selectedTemplate?.name ?? '—'}</p>
              <p className="text-[var(--text-muted)]">Agent name: {name || '—'}</p>
              <p className="text-[var(--text-muted)]">Channels: {channelsEnabled.join(', ')}</p>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Assign this agent to a tenant during onboarding, then deploy from the tenant or agent page.
            </p>
          </section>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-[var(--separator)]">
          <Button
            type="button"
            variant="secondary"
            onClick={() => (step === 1 ? handleClose() : setStep((prev) => prev - 1))}
            disabled={isSubmitting}
            className="rounded-xl px-5"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < STEPS.length ? (
            <div className="flex flex-col items-end gap-1">
              <Button
                type="button"
                onClick={() => setStep((prev) => prev + 1)}
                disabled={!canContinue || isSubmitting}
                className="rounded-xl px-5"
              >
                Continue
              </Button>
              {step === 1 && !canContinue && !templatesLoading && (
                <p className="text-xs text-[var(--text-muted)]">
                  {templates.length === 0
                    ? 'No template can be selected yet.'
                    : 'Select a template to continue.'}
                </p>
              )}
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => {
                handleSubmit().catch(() => {});
              }}
              loading={isSubmitting}
              disabled={!canContinue || isSubmitting}
              className="rounded-xl px-5"
            >
              Create Agent
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

