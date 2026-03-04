/**
 * Retention policies section.
 */

import type { RetentionPolicy } from '../../../../adapters/local/settings.adapter';

interface RetentionSectionProps {
  policies: RetentionPolicy[];
  onToggle?: (id: string, enabled: boolean) => void;
  onDaysChange?: (id: string, days: number) => void;
}

/** Renders retention policy toggles and editable day windows per data domain. */
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
      <div className="space-y-3">
        {policies.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)]/50 transition-colors"
          >
            <div className="min-w-0">
              <p className="font-medium text-[var(--text-primary)]">{p.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <label className="text-sm text-[var(--text-muted)]">Retain for</label>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={p.days}
                  onChange={(e) => onDaysChange?.(p.id, parseInt(e.target.value, 10) || 90)}
                  className="w-20 px-2 py-1 text-sm rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                />
                <span className="text-sm text-[var(--text-muted)]">days</span>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer shrink-0">
              <span className="text-sm text-[var(--text-muted)]">
                {p.enabled ? 'On' : 'Off'}
              </span>
              <div className="relative w-11 h-6 rounded-full bg-[var(--border-subtle)] transition-colors has-[input:checked]:bg-[var(--ds-primary)]">
                <input
                  type="checkbox"
                  checked={p.enabled}
                  onChange={(e) => onToggle?.(p.id, e.target.checked)}
                  className="sr-only peer"
                />
                <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
