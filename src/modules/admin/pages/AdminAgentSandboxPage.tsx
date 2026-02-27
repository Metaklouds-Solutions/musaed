/**
 * Agent sandbox. Test voice agents only. Simulate call flow with sample transcript or scenario.
 * Select which voice agent to test; output varies by agent skills. Uses PopoverSelect for UI consistency.
 */

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { PageHeader, Button, PopoverSelect } from '../../../shared/ui';
import { agentsAdapter } from '../../../adapters';
import { Bot, Play, Loader2 } from 'lucide-react';

const SCENARIO_OPTIONS = [
  { value: 'booking', label: 'Booking request' },
  { value: 'billing', label: 'Billing question' },
  { value: 'general', label: 'General inquiry' },
  { value: 'prescription', label: 'Prescription refill' },
] as const;

const SCENARIO_TRANSCRIPTS: Record<(typeof SCENARIO_OPTIONS)[number]['value'], string> = {
  booking:
    'Patient: I need to book a follow-up. Agent: I can help with that. When works for you? Patient: Next Tuesday afternoon. Agent: We have 2pm and 4pm. Patient: 2pm please. Agent: Done, you\'re booked for Tuesday at 2pm.',
  billing:
    'Patient: I have a billing question. Agent: Sure, what\'s the issue? Patient: I was charged twice. Agent: I\'ll escalate to billing to fix that. Patient: Thanks.',
  general:
    'Patient: What are your hours? Agent: We\'re open Mon–Fri 9am–5pm. Patient: Do you take walk-ins? Agent: Yes, but appointments are recommended. Patient: Got it, thanks.',
  prescription:
    'Patient: I need a refill on my prescription. Agent: I can help with that. Which medication? Patient: Lisinopril. Agent: I\'ll send the request to your doctor. You\'ll get a call within 24 hours.',
};

/** Skill IDs that map to scenario types. */
const SCENARIO_SKILL_MAP: Record<string, string> = {
  booking: 'sk_001',
  billing: 'sk_002',
  prescription: 'sk_003',
  general: 'sk_004',
};

interface SimulatedOutcome {
  outcome: string;
  confidence: number;
  entities: { type: string; value: string }[];
  suggestedAction: string;
  skillMatch?: boolean;
}

function simulateCallFlow(
  transcript: string,
  agentId: string,
  agentSkills: string[]
): SimulatedOutcome {
  const scenario = Object.entries(SCENARIO_TRANSCRIPTS).find(([, v]) => v === transcript)?.[0] ?? 'general';
  const requiredSkill = SCENARIO_SKILL_MAP[scenario];
  const hasSkill = !requiredSkill || agentSkills.includes(requiredSkill);

  if (!hasSkill) {
    return {
      outcome: 'Skill not enabled',
      confidence: 1,
      entities: [
        { type: 'intent', value: scenario },
        { type: 'agent_skill_gap', value: `Agent lacks skill for ${scenario}` },
      ],
      suggestedAction: 'Enable the required skill for this agent in Agent settings.',
      skillMatch: false,
    };
  }

  const lower = transcript.toLowerCase();
  if (lower.includes('book') || lower.includes('appointment') || lower.includes('2pm') || lower.includes('4pm')) {
    return {
      outcome: 'Booking created',
      confidence: 0.92,
      entities: [
        { type: 'intent', value: 'book_appointment' },
        { type: 'date', value: 'Next Tuesday' },
        { type: 'time', value: '2pm' },
        { type: 'customer_sentiment', value: 'positive' },
      ],
      suggestedAction: 'Confirm booking in system and send reminder.',
      skillMatch: true,
    };
  }
  if (lower.includes('billing') || lower.includes('charged') || lower.includes('escalat')) {
    return {
      outcome: 'Escalated to billing',
      confidence: 0.88,
      entities: [
        { type: 'intent', value: 'billing_inquiry' },
        { type: 'issue', value: 'duplicate charge' },
        { type: 'customer_sentiment', value: 'neutral' },
      ],
      suggestedAction: 'Create support ticket for billing team.',
      skillMatch: true,
    };
  }
  if (lower.includes('refill') || lower.includes('prescription') || lower.includes('medication')) {
    return {
      outcome: 'Refill request submitted',
      confidence: 0.9,
      entities: [
        { type: 'intent', value: 'prescription_refill' },
        { type: 'medication', value: 'Lisinopril' },
        { type: 'customer_sentiment', value: 'neutral' },
      ],
      suggestedAction: 'Forward to prescribing physician; notify patient within 24h.',
      skillMatch: true,
    };
  }
  return {
    outcome: 'General inquiry resolved',
    confidence: 0.85,
    entities: [
      { type: 'intent', value: 'general_inquiry' },
      { type: 'topic', value: 'hours and walk-ins' },
      { type: 'customer_sentiment', value: 'positive' },
    ],
    suggestedAction: 'No follow-up required.',
    skillMatch: true,
  };
}

export function AdminAgentSandboxPage() {
  const agents = useMemo(() => agentsAdapter.listVoiceAgents(), []);
  const agentOptions = useMemo(
    () =>
      agents.map((a) => ({
        value: a.id,
        label: `${a.name}${a.tenantName ? ` (${a.tenantName})` : ' (Available)'}`,
      })),
    [agents]
  );

  const [selectedAgentId, setSelectedAgentId] = useState(agentOptions[0]?.value ?? '');
  const hasVoiceAgents = agentOptions.length > 0;
  const [selectedScenario, setSelectedScenario] = useState<(typeof SCENARIO_OPTIONS)[number]['value']>('booking');
  const [customTranscript, setCustomTranscript] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [result, setResult] = useState<SimulatedOutcome | null>(null);
  const [loading, setLoading] = useState(false);

  const transcript = useCustom ? customTranscript : SCENARIO_TRANSCRIPTS[selectedScenario];
  const agentDetails = useMemo(
    () => (selectedAgentId ? agentsAdapter.getDetails(selectedAgentId) : null),
    [selectedAgentId]
  );
  const agentSkillIds = useMemo(
    () => agentDetails?.enabledSkills?.map((s) => s.id) ?? [],
    [agentDetails]
  );

  const handleRun = useCallback(() => {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(simulateCallFlow(transcript, selectedAgentId, agentSkillIds));
      setLoading(false);
    }, 800);
  }, [transcript, selectedAgentId, agentSkillIds]);

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Voice Agent Sandbox"
          description="Test voice agents with sample call transcripts. Select agent, pick a scenario or paste custom transcript."
        />
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
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
              onChange={setSelectedAgentId}
              options={agentOptions}
              placeholder="Select voice agent"
              title="Voice agents"
              aria-label="Select voice agent to test"
            />
            )}
            {agentDetails && agentDetails.enabledSkills?.length > 0 && (
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                Skills: {agentDetails.enabledSkills.map((s) => s.name).join(', ')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Scenario
            </label>
            <PopoverSelect
              value={useCustom ? '__custom__' : selectedScenario}
              onChange={(v) => {
                if (v === '__custom__') {
                  setUseCustom(true);
                } else {
                  setUseCustom(false);
                  setSelectedScenario(v as (typeof SCENARIO_OPTIONS)[number]['value']);
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
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Transcript
            </label>
            <textarea
              value={useCustom ? customTranscript : transcript}
              onChange={(e) => {
                setCustomTranscript(e.target.value);
                if (!useCustom) setUseCustom(true);
              }}
              rows={8}
              placeholder="Paste or type a sample call transcript…"
              className="w-full px-4 py-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] resize-y"
            />
          </div>

          <Button
            onClick={handleRun}
            disabled={loading || !transcript.trim() || !hasVoiceAgents}
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

        <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
          <h3 className="font-semibold text-[var(--text-primary)]">Output</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Predicted outcome and extracted entities. Varies by agent skills.
          </p>
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Bot className="w-12 h-12 text-[var(--ds-primary)] animate-pulse" />
              <p className="text-sm text-[var(--text-muted)]">Analyzing transcript…</p>
            </div>
          )}
          {!loading && result && (
            <div className="space-y-4">
              {result.skillMatch === false && (
                <div className="p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/30 text-[var(--warning)] text-sm">
                  This agent does not have the skill required for this scenario.
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Predicted outcome
                </p>
                <p className="font-semibold text-[var(--text-primary)]">{result.outcome}</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  Entities extracted
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.entities.map((e, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-hover)] text-sm"
                    >
                      <span className="text-[var(--text-muted)]">{e.type}:</span>
                      <span className="text-[var(--text-primary)] font-medium">{e.value}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Suggested action
                </p>
                <p className="text-sm text-[var(--text-primary)]">{result.suggestedAction}</p>
              </div>
            </div>
          )}
          {!loading && !result && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <Bot className="w-12 h-12 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                Run a simulation to see predicted outcome and entities.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
