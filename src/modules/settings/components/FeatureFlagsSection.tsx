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
      <div className="space-y-4">
        {ITEMS.map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
          >
            <div>
              <p className="font-medium text-[var(--text-primary)]">{label}</p>
              <p className="text-sm text-[var(--text-muted)]">{desc}</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={flags[key]}
                onChange={(e) => update(key, e.target.checked)}
                className="accent-[var(--ds-primary)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">On</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
