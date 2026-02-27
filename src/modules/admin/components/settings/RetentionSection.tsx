/**
 * Retention policies section.
 */

import type { RetentionPolicy } from '../../../../adapters/local/settings.adapter';

interface RetentionSectionProps {
  policies: RetentionPolicy[];
  onToggle?: (id: string, enabled: boolean) => void;
  onDaysChange?: (id: string, days: number) => void;
}

export function RetentionSection({
  policies,
  onToggle,
  onDaysChange,
}: RetentionSectionProps) {
  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <h3 className="font-semibold text-[var(--text-primary)]">Retention Policies</h3>
      <p className="text-sm text-[var(--text-muted)]">
        How long to retain call data and audit logs.
      </p>
      <div className="space-y-4">
        {policies.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
          >
            <div>
              <p className="font-medium text-[var(--text-primary)]">{p.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <label className="text-sm text-[var(--text-muted)]">Retain for</label>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={p.days}
                  onChange={(e) => onDaysChange?.(p.id, parseInt(e.target.value, 10) || 90)}
                  className="w-20 px-2 py-1 text-sm rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                />
                <span className="text-sm text-[var(--text-muted)]">days</span>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={p.enabled}
                onChange={(e) => onToggle?.(p.id, e.target.checked)}
                className="accent-[var(--ds-primary)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">Enabled</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
