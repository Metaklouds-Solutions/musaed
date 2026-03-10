/**
 * Step 1: Clinic info form. Name, owner, email, phone, address, timezone, plan, locale.
 */

import { PopoverSelect } from '../../../../shared/ui';

const PLAN_OPTIONS = ['STARTER', 'PRO', 'ENTERPRISE'];
const TIMEZONE_OPTIONS = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Karachi'];
const LOCALE_OPTIONS = ['en-US', 'en-GB', 'ar-SA'];

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] focus:border-transparent text-sm';

function FormField({
  label,
  id,
  required,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[10px] font-mono font-normal text-[var(--text-muted)] mb-1.5 tracking-[0.5px] uppercase"
      >
        {label} {required && '*'}
      </label>
      {children}
    </div>
  );
}

export interface ClinicInfoData {
  name: string;
  plan: string;
  ownerEmail: string;
  ownerName: string;
  phone: string;
  address: string;
  timezone: string;
  locale: string;
}

interface TenantWizardStep1ClinicInfoProps {
  data: ClinicInfoData;
  onChange: (data: ClinicInfoData) => void;
}

/** Renders clinic profile inputs for step one of tenant onboarding wizard. */
export function TenantWizardStep1ClinicInfo({ data, onChange }: TenantWizardStep1ClinicInfoProps) {
  const set = (key: keyof ClinicInfoData) => (value: string) =>
    onChange({ ...data, [key]: value });
  const handleEmailChange = (value: string) => set('ownerEmail')(value.replace(/\s+/g, '').toLowerCase());
  const handlePhoneChange = (value: string) => set('phone')(value.replace(/[^\d+\-\s()]/g, ''));

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-3.5 space-y-3.5">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Business Profile</p>
          <p className="text-xs text-[var(--text-muted)]">Core tenant information and ownership details.</p>
        </div>
        <FormField label="Clinic name" id="tenant-name" required>
        <input
          id="tenant-name"
          type="text"
          value={data.name}
          onChange={(e) => set('name')(e.target.value)}
          placeholder="e.g. Sunrise Clinic"
          className={inputClass}
          required
        />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Owner name" id="owner-name">
            <input
              id="owner-name"
              type="text"
              value={data.ownerName}
              onChange={(e) => set('ownerName')(e.target.value)}
              placeholder="John Doe"
              className={inputClass}
            />
          </FormField>
          <FormField label="Owner email" id="owner-email" required>
            <input
              id="owner-email"
              type="email"
              value={data.ownerEmail}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="owner@clinic.com"
              className={inputClass}
              inputMode="email"
              autoComplete="email"
              pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
              title="Please enter a valid email address."
              spellCheck={false}
              required
            />
          </FormField>
        </div>

        <FormField label="Phone" id="phone">
          <input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="+1 555-0100"
            className={inputClass}
            inputMode="tel"
            autoComplete="tel"
          />
        </FormField>

        <FormField label="Address" id="address">
          <input
            id="address"
            type="text"
            value={data.address}
            onChange={(e) => set('address')(e.target.value)}
            placeholder="123 Main St, City"
            className={inputClass}
          />
        </FormField>
      </section>

      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 p-3.5 space-y-3.5">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Regional Settings</p>
          <p className="text-xs text-[var(--text-muted)]">Default plan and locale configuration for onboarding.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 [&>div]:min-w-0">
          <FormField label="Plan" id="plan">
            <PopoverSelect
              value={data.plan}
              onChange={(v) => set('plan')(v)}
              options={PLAN_OPTIONS.map((p) => ({ value: p, label: p }))}
              triggerClassName="w-full min-w-0 !rounded-xl"
            />
          </FormField>
          <FormField label="Timezone" id="timezone">
            <PopoverSelect
              value={data.timezone}
              onChange={(v) => set('timezone')(v)}
              options={TIMEZONE_OPTIONS.map((tz) => ({ value: tz, label: tz }))}
              triggerClassName="w-full min-w-0 !rounded-xl"
            />
          </FormField>
          <FormField label="Locale" id="locale">
            <PopoverSelect
              value={data.locale}
              onChange={(v) => set('locale')(v)}
              options={LOCALE_OPTIONS.map((loc) => ({ value: loc, label: loc }))}
              triggerClassName="w-full min-w-0 !rounded-xl"
            />
          </FormField>
        </div>
      </section>
    </div>
  );
}
