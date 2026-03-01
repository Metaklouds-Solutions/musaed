/**
 * Custom prompts section. Greeting, agent name, system instructions per agent.
 */

import { useState, useMemo, useEffect } from 'react';
import { PopoverSelect } from '../../../../shared/ui';
import { agentsAdapter, settingsAdapter } from '../../../../adapters';
import type { TenantSettings, AgentPromptConfig } from '../../../../adapters/local/settings.adapter';
import { MessageSquare } from 'lucide-react';

interface CustomPromptsSectionProps {
  tenantId: string | undefined;
  settings: TenantSettings;
  onChange: (settings: TenantSettings) => void;
}

export function CustomPromptsSection({ tenantId, settings, onChange }: CustomPromptsSectionProps) {
  const agents = useMemo(
    () => (tenantId ? agentsAdapter.getAgentsForTenant(tenantId) : []),
    [tenantId]
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string>(() => agents[0]?.id ?? '');

  useEffect(() => {
    if (agents.length > 0 && !agents.some((a) => a.id === selectedAgentId)) {
      setSelectedAgentId(agents[0].id);
    } else if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  const prompts: AgentPromptConfig = selectedAgentId
    ? settingsAdapter.getAgentPrompts(tenantId, selectedAgentId)
    : {
        greetingMessage: settings.greetingMessage,
        agentName: settings.agentName,
        systemPrompt: settings.systemPrompt,
      };

  const updatePrompts = (patch: AgentPromptConfig) => {
    if (!selectedAgentId) return;
    const agentPrompts = { ...settings.agentPrompts, [selectedAgentId]: { ...prompts, ...patch } };
    onChange({ ...settings, agentPrompts });
  };

  const agentOptions = agents.map((a) => ({ value: a.id, label: `${a.name} (${a.voice})` }));

  if (!tenantId) return null;
  if (agents.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
        <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <MessageSquare size={18} aria-hidden />
          Custom Prompts
        </h3>
        <p className="text-sm text-[var(--text-muted)]">
          No agents assigned to this clinic. Assign an agent in Admin to configure prompts.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <MessageSquare size={18} aria-hidden />
        Custom Prompts
      </h3>
      <p className="text-sm text-[var(--text-muted)]">
        Customize your voice agent&apos;s greeting, name, and instructions. Select an agent to edit.
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Agent</label>
          <PopoverSelect
            value={selectedAgentId}
            onChange={(v) => setSelectedAgentId(v)}
            options={agentOptions}
            placeholder="Select agent"
            title="Voice agent"
            aria-label="Select agent for prompts"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Agent Name</label>
          <input
            type="text"
            value={prompts.agentName ?? ''}
            onChange={(e) => updatePrompts({ agentName: e.target.value || undefined })}
            className="w-full px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
            placeholder="Alex (Professional & Empathetic)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Greeting Message</label>
          <textarea
            value={prompts.greetingMessage ?? ''}
            onChange={(e) => updatePrompts({ greetingMessage: e.target.value || undefined })}
            rows={2}
            className="w-full px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none"
            placeholder="Hello, thank you for calling..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">System Instructions</label>
          <textarea
            value={prompts.systemPrompt ?? ''}
            onChange={(e) => updatePrompts({ systemPrompt: e.target.value || undefined })}
            rows={4}
            className="w-full px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none"
            placeholder="You are a helpful clinic receptionist..."
          />
        </div>
      </div>
    </div>
  );
}
