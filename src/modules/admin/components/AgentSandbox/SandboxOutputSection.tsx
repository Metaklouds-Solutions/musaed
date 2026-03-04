/**
 * Agent sandbox output: predicted outcome, entities, suggested action.
 */

import { Bot } from 'lucide-react';
import type { SimulatedOutcome } from './simulateCallFlow';

interface SandboxOutputSectionProps {
  loading: boolean;
  result: SimulatedOutcome | null;
}

export function SandboxOutputSection({ loading, result }: SandboxOutputSectionProps) {
  return (
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
  );
}
