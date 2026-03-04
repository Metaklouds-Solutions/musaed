/**
 * Business hours section. Extended hours configuration.
 */

import type { TenantSettings } from '../../../adapters/local/settings.adapter';

interface BusinessHoursSectionProps {
  businessHours: string;
  onChange: (businessHours: string) => void;
}

export function BusinessHoursSection({ businessHours, onChange }: BusinessHoursSectionProps) {
  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <h3 className="font-semibold text-[var(--text-primary)]">Business Hours</h3>
      <p className="text-sm text-[var(--text-muted)]">
        When your clinic is open. Used for appointment availability.
      </p>
      <div>
        <input
          type="text"
          value={businessHours}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Mon–Fri 9am–5pm, Sat 9am–1pm"
          className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] text-sm"
        />
      </div>
    </div>
  );
}
