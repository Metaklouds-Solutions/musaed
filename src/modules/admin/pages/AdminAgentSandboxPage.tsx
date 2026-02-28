/**
 * Agent sandbox. Test voice agents with sample call transcripts.
 * Orchestrates SandboxInputSection and SandboxOutputSection.
 */

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { PageHeader } from '../../../shared/ui';
import { agentsAdapter } from '../../../adapters';
import {
  SandboxInputSection,
  SandboxOutputSection,
  simulateCallFlow,
  SCENARIO_TRANSCRIPTS,
} from '../components/AgentSandbox';
import type { ScenarioValue } from '../components/AgentSandbox';

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
  const [selectedScenario, setSelectedScenario] = useState<ScenarioValue>('booking');
  const [customTranscript, setCustomTranscript] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof simulateCallFlow> | null>(null);
  const [loading, setLoading] = useState(false);

  const transcript = useCustom ? customTranscript : SCENARIO_TRANSCRIPTS[selectedScenario] ?? '';
  const agentDetails = useMemo(
    () => (selectedAgentId ? agentsAdapter.getDetails(selectedAgentId) : null),
    [selectedAgentId]
  );
  const agentSkillIds = useMemo(
    () => agentDetails?.enabledSkills?.map((s) => s.id) ?? [],
    [agentDetails]
  );
  const agentSkillsLabel =
    agentDetails && agentDetails.enabledSkills?.length
      ? `Skills: ${agentDetails.enabledSkills.map((s) => s.name).join(', ')}`
      : undefined;

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
        <SandboxInputSection
          agentOptions={agentOptions}
          selectedAgentId={selectedAgentId}
          onAgentChange={setSelectedAgentId}
          selectedScenario={selectedScenario}
          onScenarioChange={setSelectedScenario}
          transcript={transcript}
          useCustom={useCustom}
          onUseCustomChange={setUseCustom}
          customTranscript={customTranscript}
          onCustomTranscriptChange={setCustomTranscript}
          agentSkillsLabel={agentSkillsLabel}
          loading={loading}
          onRun={handleRun}
        />
        <SandboxOutputSection loading={loading} result={result} />
      </motion.div>
    </div>
  );
}
