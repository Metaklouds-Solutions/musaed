import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../../shared/ui';
import type { AgentLlmConfig } from '../../../../shared/types';

interface AgentLlmTabProps {
  llmConfig: AgentLlmConfig;
}

/** Renders agent LLM model configuration and prompt settings. */
export function AgentLlmTab({ llmConfig }: AgentLlmTabProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card variant="glass">
        <CardHeader className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          LLM configuration
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Model</dt>
              <dd className="font-medium mt-1">{llmConfig.model}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Temperature</dt>
              <dd className="font-medium mt-1">{llmConfig.temperature}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Max tokens</dt>
              <dd className="font-medium mt-1">{llmConfig.maxTokens}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Custom prompt</dt>
              <dd className="font-medium mt-1">{llmConfig.customPromptEnabled ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Language detection</dt>
              <dd className="font-medium mt-1">{llmConfig.languageDetection}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Fallback language</dt>
              <dd className="font-medium mt-1">{llmConfig.fallbackLanguage}</dd>
            </div>
          </dl>
          {llmConfig.systemPrompt && (
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
              <dt className="text-[var(--text-muted)] text-sm mb-2">System prompt</dt>
              <dd className="text-sm whitespace-pre-wrap bg-[var(--bg-subtle)] rounded-lg p-4 font-mono">
                {llmConfig.systemPrompt}
              </dd>
            </div>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}
