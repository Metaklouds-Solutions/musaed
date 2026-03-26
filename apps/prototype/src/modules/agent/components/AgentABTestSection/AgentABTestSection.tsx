/**
 * A/B test config section. Enable split, set traffic %, label versions.
 */

import { motion } from 'motion/react';
import { TestTube } from 'lucide-react';
import { abTestAdapter } from '../../../../adapters';
import type { ABTestConfig } from '../../../../adapters';
import { toast } from 'sonner';

interface AgentABTestSectionProps {
  tenantId: string | undefined;
  config: ABTestConfig;
  onChange: (config: ABTestConfig) => void;
}

export function AgentABTestSection({ tenantId, config, onChange }: AgentABTestSectionProps) {
  if (!tenantId) return null;

  const update = async (partial: Partial<ABTestConfig>) => {
    const previous = { ...config };
    const next = { ...config, ...partial };
    onChange(next);
    try {
      await abTestAdapter.setConfig(tenantId, partial);
    } catch (error) {
      onChange(previous);
      const message =
        error instanceof Error ? error.message : 'Failed to update A/B test settings';
      toast.error(message);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="rounded-[var(--radius-card)] card-glass p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <TestTube className="w-5 h-5 text-[var(--ds-primary)]" aria-hidden />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">A/B Testing</h2>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Run two agent versions in parallel and compare outcomes in Reports.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)]">
          <div>
            <p className="font-medium text-[var(--text-primary)]">Enable A/B test</p>
            <p className="text-sm text-[var(--text-muted)]">Split traffic between Version A and B</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => void update({ enabled: e.target.checked })}
              className="accent-[var(--ds-primary)]"
              aria-label="Enable A/B testing"
            />
            <span className="text-sm text-[var(--text-secondary)]">On</span>
          </label>
        </div>

        {config.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                Traffic split: {config.splitPercentA}% A / {100 - config.splitPercentA}% B
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={config.splitPercentA}
                onChange={(e) =>
                  void update({ splitPercentA: Number(e.target.value) })
                }
                className="w-full accent-[var(--ds-primary)]"
                aria-label="Traffic split percentage for version A"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Version A label
                </label>
                <input
                  type="text"
                  value={config.versionALabel}
                  onChange={(e) => void update({ versionALabel: e.target.value })}
                  placeholder="e.g. Current"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Version B label
                </label>
                <input
                  type="text"
                  value={config.versionBLabel}
                  onChange={(e) => void update({ versionBLabel: e.target.value })}
                  placeholder="e.g. New"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)]/30"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
