/**
 * Feature flags section. Toggle Reports, Calendar per tenant.
 */

import { featureFlagsAdapter } from '../../../adapters';
import type { FeatureFlags, FeatureFlagKey } from '../../../adapters/local/featureFlags.adapter';

interface FeatureFlagsSectionProps {
  tenantId: string | undefined;
  flags: FeatureFlags;
  onChange: (flags: FeatureFlags) => void;
}

const ITEMS: { key: FeatureFlagKey; label: string; desc: string }[] = [
  { key: 'enableReports', label: 'Enable Reports', desc: 'Show Reports in navigation and allow access' },
  { key: 'enableCalendar', label: 'Enable Calendar', desc: 'Show Calendar in navigation and allow access' },
];

export function FeatureFlagsSection({ tenantId, flags, onChange }: FeatureFlagsSectionProps) {
  if (!tenantId) return null;

  const update = (key: FeatureFlagKey, value: boolean) => {
    const next = { ...flags, [key]: value };
    onChange(next);
    featureFlagsAdapter.setFeatureFlag(tenantId, key, value);
  };

  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <h3 className="font-semibold text-[var(--text-primary)]">Feature Flags</h3>
      <p className="text-sm text-[var(--text-muted)]">
        Toggle features for this clinic. Changes apply immediately.
      </p>
      <div className="space-y-3">
        {ITEMS.map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)]/50 transition-colors"
          >
            <div className="min-w-0">
              <p className="font-medium text-[var(--text-primary)]">{label}</p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">{desc}</p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer shrink-0">
              <span className="text-sm text-[var(--text-muted)]">
                {flags[key] ? 'On' : 'Off'}
              </span>
              <div className="relative w-11 h-6 rounded-full bg-[var(--border-subtle)] transition-colors has-[input:checked]:bg-[var(--ds-primary)]">
                <input
                  type="checkbox"
                  checked={flags[key]}
                  onChange={(e) => update(key, e.target.checked)}
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
