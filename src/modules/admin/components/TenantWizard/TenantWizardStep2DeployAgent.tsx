/**
 * Step 2: Deploy agent. List platform agents, Deploy button.
 */

import { Bot } from 'lucide-react';
import { Button } from '../../../../shared/ui';

export interface PlatformAgent {
  id: string;
  name: string;
  voice: string;
  language: string;
}

interface TenantWizardStep2DeployAgentProps {
  agents: PlatformAgent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDeploy: () => void;
  onSkip?: () => void;
  isDeploying?: boolean;
}

export function TenantWizardStep2DeployAgent({
  agents,
  selectedId,
  onSelect,
  onDeploy,
  onSkip,
  isDeploying = false,
}: TenantWizardStep2DeployAgentProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        Select an agent from the platform catalog to deploy to this tenant.
      </p>
      <div className="space-y-2">
        {agents.map((a) => {
          const selected = selectedId === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-colors ${
                selected
                  ? 'border-[var(--ds-primary)] bg-[rgba(99,102,241,0.12)] shadow-[0_0_0_1px_rgba(124,92,255,0.2)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 hover:bg-[var(--bg-hover)]'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-[var(--text-muted)]" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--text-primary)]">{a.name}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {a.voice} · {a.language}
                </p>
              </div>
              {selected && (
                <span className="text-xs font-medium text-[var(--ds-primary)]">Selected</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onDeploy}
          disabled={!selectedId || isDeploying}
          loading={isDeploying}
        >
          Deploy Agent
        </Button>
        {onSkip && (
          <Button variant="ghost" onClick={onSkip} disabled={isDeploying}>
            Skip for now
          </Button>
        )}
      </div>
    </div>
  );
}
