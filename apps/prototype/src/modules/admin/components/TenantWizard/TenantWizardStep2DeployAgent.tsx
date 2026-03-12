/**
 * Step 2: Assign an existing agent to the tenant (shows all agents; only unassigned can be assigned).
 */

import { Bot } from 'lucide-react';
import { Button } from '../../../../shared/ui';
import type { AdminAgentRow } from '../../../../shared/types';

interface TenantWizardStep2DeployAgentProps {
  agents: AdminAgentRow[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  isSubmitting?: boolean;
  isLoading?: boolean;
  loadError?: string | null;
  onRetryLoad?: () => void;
}

/** Renders agent list for wizard step two; allows optional assignment. */
export function TenantWizardStep2DeployAgent({
  agents,
  selectedAgentId,
  onSelectAgent,
  onContinue,
  onSkip,
  isSubmitting = false,
  isLoading = false,
  loadError = null,
  onRetryLoad,
}: TenantWizardStep2DeployAgentProps) {
  const showEmpty = !isLoading && !loadError && agents.length === 0;
  const canContinue = !isSubmitting && !isLoading && !loadError;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-3.5">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Assign Agent</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Pick one agent to connect with this tenant. Only unassigned agents can be assigned; you can skip and assign later.
        </p>
      </div>
      <div className="space-y-2">
        {isLoading && (
          <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 p-4 text-sm text-[var(--text-muted)]">
            Loading agents...
          </p>
        )}
        {loadError && (
          <div className="rounded-xl border border-[var(--error)]/40 bg-[rgba(239,68,68,0.08)] p-4 text-sm text-[var(--text-primary)]">
            <p className="text-[var(--text-primary)]">Failed to load agents.</p>
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
            No agents yet. Create an agent from Admin → Agents first, or continue to create tenant only.
          </p>
        )}
        {agents.length > 0 && (
          <div className="max-h-[min(40vh,16rem)] overflow-y-auto space-y-2 pr-1">
            {agents.map((agent) => {
              const selected = selectedAgentId === agent.id;
              const isAssigned = Boolean(agent.tenantId ?? agent.tenantName);
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => onSelectAgent(agent.id)}
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
                    <p className="font-semibold text-[var(--text-primary)]">{agent.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {agent.voice} · {agent.language}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Status: {agent.status}
                      {isAssigned && (
                        <span className="ml-1 text-[var(--text-muted)]">
                          · Assigned to {agent.tenantName ?? 'another tenant'}
                        </span>
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
          {selectedAgentId ? 'Create Tenant + Assign Agent' : 'Create Tenant'}
        </Button>
        <Button variant="secondary" onClick={onSkip} disabled={isSubmitting} className="rounded-xl px-5">
          Continue without assignment
        </Button>
      </div>
    </div>
  );
}
