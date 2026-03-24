/**
 * Clinic profile section. Timezone, locale, business hours.
 */

import { PopoverSelect } from '../../../shared/ui';
import type { TenantSettings } from '../../../adapters/local/settings.adapter';

interface ClinicProfileSectionProps {
  settings: TenantSettings;
  onChange: (settings: TenantSettings) => void;
}

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'Asia/Karachi', label: 'Asia/Karachi' },
];

const LOCALE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (GB)' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'ar', label: 'Arabic' },
];

export function ClinicProfileSection({ settings, onChange }: ClinicProfileSectionProps) {
  const update = (patch: Partial<TenantSettings>) =>
    onChange({ ...settings, ...patch });

  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <h3 className="font-semibold text-[var(--text-primary)]">Clinic Profile</h3>
      <p className="text-sm text-[var(--text-muted)]">
        Timezone, locale, and business hours for this clinic.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
            Timezone
          </label>
          <PopoverSelect
            value={settings.timezone}
            onChange={(v) => update({ timezone: v })}
            options={TIMEZONE_OPTIONS}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
            Locale
          </label>
          <PopoverSelect
            value={settings.locale}
            onChange={(v) => update({ locale: v })}
            options={LOCALE_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}
