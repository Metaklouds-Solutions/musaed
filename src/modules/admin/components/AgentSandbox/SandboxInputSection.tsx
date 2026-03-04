/**
 * Agent sandbox input: agent select, scenario, transcript, run button.
 */

import { Button, PopoverSelect } from '../../../../shared/ui';
import { Play, Loader2 } from 'lucide-react';

const SCENARIO_OPTIONS = [
  { value: 'booking', label: 'Booking request' },
  { value: 'billing', label: 'Billing question' },
  { value: 'general', label: 'General inquiry' },
  { value: 'prescription', label: 'Prescription refill' },
] as const;

export type ScenarioValue = (typeof SCENARIO_OPTIONS)[number]['value'];

function isScenarioValue(s: unknown): s is ScenarioValue {
  return (
    s === 'booking' ||
    s === 'billing' ||
    s === 'general' ||
    s === 'prescription'
  );
}

interface SandboxInputSectionProps {
  agentOptions: { value: string; label: string }[];
  selectedAgentId: string;
  onAgentChange: (id: string) => void;
  selectedScenario: ScenarioValue;
  onScenarioChange: (v: ScenarioValue) => void;
  transcript: string;
  useCustom: boolean;
  onUseCustomChange: (v: boolean) => void;
  customTranscript: string;
  onCustomTranscriptChange: (v: string) => void;
  agentSkillsLabel?: string;
  loading: boolean;
  onRun: () => void;
}

/** Renders sandbox input controls for agent selection, scenario, and transcript. */
export function SandboxInputSection(props: SandboxInputSectionProps) {
  const {
    agentOptions,
    selectedAgentId,
    onAgentChange,
    selectedScenario,
    onScenarioChange,
    transcript,
    useCustom,
    onUseCustomChange,
    customTranscript,
    onCustomTranscriptChange,
    agentSkillsLabel,
    loading,
    onRun,
  } = props;
  const hasVoiceAgents = agentOptions.length > 0;
  const displayTranscript = useCustom ? customTranscript : transcript;

  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <h3 className="font-semibold text-[var(--text-primary)]">Input</h3>
      <p className="text-sm text-[var(--text-muted)]">
        Choose which voice agent to test, then pick a scenario or paste your own call transcript.
      </p>

      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
          Voice agent to test
        </label>
        {!hasVoiceAgents ? (
          <p className="text-sm text-[var(--text-muted)] py-3 px-4 rounded-lg bg-[var(--bg-hover)]">
            No voice agents deployed yet. Assign an agent to a tenant in Agents.
          </p>
        ) : (
          <PopoverSelect
            value={selectedAgentId}
            onChange={onAgentChange}
            options={agentOptions}
            placeholder="Select voice agent"
            title="Voice agents"
            aria-label="Select voice agent to test"
          />
        )}
        {agentSkillsLabel && (
          <p className="text-xs text-[var(--text-muted)] mt-1.5">{agentSkillsLabel}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Scenario</label>
        <PopoverSelect
          value={useCustom ? '__custom__' : selectedScenario}
          onChange={(v) => {
            if (v === '__custom__') {
              onUseCustomChange(true);
            } else if (isScenarioValue(v)) {
              onUseCustomChange(false);
              onScenarioChange(v);
            }
          }}
          options={[
            ...SCENARIO_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            { value: '__custom__', label: 'Custom transcript…' },
          ]}
          placeholder="Select scenario"
          title="Scenarios"
          aria-label="Select scenario"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Transcript</label>
        <textarea
          value={displayTranscript}
          onChange={(e) => {
            onCustomTranscriptChange(e.target.value);
            if (!useCustom) onUseCustomChange(true);
          }}
          rows={8}
          placeholder="Paste or type a sample call transcript…"
          className="w-full px-4 py-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] resize-y"
        />
      </div>

      <Button
        onClick={onRun}
        disabled={loading || !displayTranscript.trim() || !hasVoiceAgents}
        className="flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Simulating…
          </>
        ) : (
          <>
            <Play size={18} />
            Run simulation
          </>
        )}
      </Button>
    </div>
  );
}
