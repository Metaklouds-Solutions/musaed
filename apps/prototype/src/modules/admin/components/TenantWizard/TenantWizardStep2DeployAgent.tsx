/**
 * Step 2: Select template and channels for tenant onboarding.
 */

import { Bot } from 'lucide-react';
import { Button } from '../../../../shared/ui';
import type { AgentTemplateOption } from '../../../../shared/types';

type AgentChannel = 'voice' | 'chat' | 'email';

interface TenantWizardStep2DeployAgentProps {
  templates: AgentTemplateOption[];
  selectedTemplateId: string | null;
  selectedChannels: AgentChannel[];
  onSelectTemplate: (id: string) => void;
  onToggleChannel: (channel: AgentChannel) => void;
  onContinue: () => void;
  onSkip: () => void;
  isSubmitting?: boolean;
  isLoading?: boolean;
  loadError?: string | null;
  onRetryLoad?: () => void;
}

/** Renders template chooser and channels for wizard step two. */
export function TenantWizardStep2DeployAgent({
  templates,
  selectedTemplateId,
  selectedChannels,
  onSelectTemplate,
  onToggleChannel,
  onContinue,
  onSkip,
  isSubmitting = false,
  isLoading = false,
  loadError = null,
  onRetryLoad,
}: TenantWizardStep2DeployAgentProps) {
  const showEmpty = !isLoading && !loadError && templates.length === 0;
  const canContinue = Boolean(
    selectedTemplateId &&
      selectedChannels.length > 0 &&
      !isSubmitting &&
      !isLoading &&
      !loadError,
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-4">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Select Template and Channels</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Choose a template and one or more channels to create the tenant's first agent instance.
        </p>
      </div>
      <div className="space-y-2">
        {isLoading && (
          <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-4 text-sm text-[var(--text-muted)]">
            Loading templates...
          </p>
        )}
        {loadError && (
          <div className="rounded-xl border border-[var(--error)]/40 bg-[rgba(239,68,68,0.08)] p-4 text-sm text-[var(--text-primary)]">
            <p className="text-[var(--text-primary)]">Failed to load available templates.</p>
            {onRetryLoad && (
              <div className="mt-3">
                <Button variant="secondary" onClick={onRetryLoad} disabled={isSubmitting}>
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}
        {showEmpty && (
          <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-4 text-sm text-[var(--text-muted)]">
            No templates are available right now. Continue to create tenant only.
          </p>
        )}
        {templates.map((template) => {
          const selected = selectedTemplateId === template.id;
          const availableChannels = template.channels;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelectTemplate(template.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-colors ${
                selected
                  ? 'border-[var(--ds-primary)] bg-[rgba(99,102,241,0.12)] shadow-[0_0_0_1px_rgba(124,92,255,0.2),0_12px_26px_rgba(124,92,255,0.14)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 hover:bg-[var(--bg-hover)]'
              }`}
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center shrink-0 border border-[var(--border-subtle)]/70">
                <Bot className="w-5 h-5 text-[var(--text-muted)]" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--text-primary)]">{template.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {template.voice} · {template.capabilityLevel}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Channels: {availableChannels.join(', ')}</p>
              </div>
              {selected && (
                <span className="rounded-full bg-[rgba(124,92,255,0.14)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ds-primary)]">
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>
      {selectedTemplateId && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/25 p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Channels Enabled</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {(templates.find((item) => item.id === selectedTemplateId)?.channels ?? []).map((channel) => {
              const checked = selectedChannels.includes(channel);
              return (
                <label
                  key={channel}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm text-[var(--text-primary)]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleChannel(channel)}
                    className="accent-[var(--ds-primary)]"
                  />
                  {channel}
                </label>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3 pt-1">
        <Button
          onClick={onContinue}
          disabled={!canContinue}
          loading={isSubmitting}
          className="rounded-xl px-5"
        >
          Create Tenant + Agent
        </Button>
        <Button variant="secondary" onClick={onSkip} disabled={isSubmitting} className="rounded-xl px-5">
          Continue without template
        </Button>
      </div>
    </div>
  );
}
