/**
 * Agent sandbox. Test voice agents with sample call transcripts.
 * Orchestrates SandboxInputSection and SandboxOutputSection.
 */

import { motion } from 'motion/react';
import { PageHeader } from '../../../shared/ui';
import {
  SandboxInputSection,
  SandboxOutputSection,
} from '../components/AgentSandbox';
import { useAdminAgentSandbox } from '../hooks';

/** Renders interactive admin sandbox for simulating agent behavior on transcripts. */
export function AdminAgentSandboxPage() {
  const {
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
  } = useAdminAgentSandbox();

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
          onRun={run}
        />
        <SandboxOutputSection loading={loading} result={result} />
      </motion.div>
    </div>
  );
}
