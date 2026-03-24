/**
 * Step 2: Select an agent template for the tenant (shows platform templates).
 */

import { Bot } from 'lucide-react';
import { Button } from '../../../../shared/ui';
import type { AgentTemplateOption } from '../../../../shared/types';

interface TenantWizardStep2DeployAgentProps {
  templates: AgentTemplateOption[];
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  isSubmitting?: boolean;
  templatesLoading?: boolean;
  templatesError?: string | null;
  refetchTemplates?: () => void;
}

/** Renders template list for wizard step two; allows optional template selection. */
export function TenantWizardStep2DeployAgent({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onContinue,
  onSkip,
  isSubmitting = false,
  templatesLoading = false,
  templatesError = null,
  refetchTemplates,
}: TenantWizardStep2DeployAgentProps) {
  const showEmpty = !templatesLoading && !templatesError && templates.length === 0;
  const canContinue = !isSubmitting && !templatesLoading && !templatesError;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-3.5">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Select Template</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Pick one template to deploy an agent for this tenant. You can skip and deploy later.
        </p>
      </div>
      <div className="space-y-2">
        {templatesLoading && (
          <p className="rounded-xl panel-soft p-4 text-sm text-[var(--text-muted)]">
            Loading templates...
          </p>
        )}
        {templatesError && (
          <div className="rounded-xl border border-[var(--error)]/40 bg-[rgba(239,68,68,0.08)] p-4 text-sm text-[var(--text-primary)]">
            <p className="text-[var(--text-primary)]">Failed to load templates.</p>
            {refetchTemplates && (
              <div className="mt-3">
                <Button variant="secondary" onClick={refetchTemplates} disabled={isSubmitting}>
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}
        {showEmpty && (
          <p className="rounded-xl panel-soft p-4 text-sm text-[var(--text-muted)]">
            No templates available. Run the seed script to add templates.
          </p>
        )}
        {templates.length > 0 && (
          <div className="max-h-[min(40vh,16rem)] overflow-y-auto space-y-2 pr-1">
            {templates.map((template) => {
              const selected = selectedTemplateId === template.id;
              const channelsLabel = template.channels?.length
                ? template.channels.join(', ')
                : template.voice;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onSelectTemplate(template.id)}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-colors ${
                    selected
                      ? 'border-[var(--ds-primary)] bg-[rgba(99,102,241,0.12)] shadow-[0_0_0_1px_rgba(124,92,255,0.2),0_12px_26px_rgba(124,92,255,0.14)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center shrink-0 border border-[var(--border-subtle)]/70">
                    <Bot className="w-5 h-5 text-[var(--text-muted)]" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--text-primary)]">{template.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {channelsLabel}
                      {template.capabilityLevel && (
                        <span className="ml-1">· {template.capabilityLevel}</span>
                      )}
                    </p>
                  </div>
                  {selected && (
                    <span className="rounded-full bg-[rgba(124,92,255,0.14)] px-2 py-1 text-[11px] font-semibold text-[var(--ds-primary)]">
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 pt-1">
        <Button
          onClick={onContinue}
          disabled={!canContinue}
          loading={isSubmitting}
          className="rounded-xl px-5"
        >
          {selectedTemplateId ? 'Create Tenant + Deploy Agent' : 'Create Tenant'}
        </Button>
        <Button variant="secondary" onClick={onSkip} disabled={isSubmitting} className="rounded-xl px-5">
          Continue without template
        </Button>
      </div>
    </div>
  );
}
