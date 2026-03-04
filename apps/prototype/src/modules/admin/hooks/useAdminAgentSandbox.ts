import { useMemo, useState, useCallback } from 'react';
import { agentsAdapter } from '../../../adapters';
import {
  simulateCallFlow,
  SCENARIO_TRANSCRIPTS,
} from '../components/AgentSandbox';
import type { ScenarioValue } from '../components/AgentSandbox';

/** Admin agent sandbox hook for agent selection and simulation execution. */
export function useAdminAgentSandbox() {
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

  const run = useCallback(() => {
    setLoading(true);
    setResult(null);
    window.setTimeout(() => {
      setResult(simulateCallFlow(transcript, selectedAgentId, agentSkillIds));
      setLoading(false);
    }, 800);
  }, [transcript, selectedAgentId, agentSkillIds]);

  return {
    agentOptions,
    selectedAgentId,
    setSelectedAgentId,
    selectedScenario,
    setSelectedScenario,
    customTranscript,
    setCustomTranscript,
    useCustom,
    setUseCustom,
    transcript,
    agentSkillsLabel,
    result,
    loading,
    run,
  };
}
