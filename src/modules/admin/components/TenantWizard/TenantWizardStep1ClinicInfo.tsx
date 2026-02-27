/**
 * Step 1: Clinic info form. Name, owner, email, phone, address, timezone, plan, locale.
 */

const PLAN_OPTIONS = ['STARTER', 'PRO', 'ENTERPRISE'];
const TIMEZONE_OPTIONS = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Karachi'];
const LOCALE_OPTIONS = ['en-US', 'en-GB', 'ar-SA'];

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] focus:border-transparent text-sm';

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

export function TenantWizardStep1ClinicInfo({ data, onChange }: TenantWizardStep1ClinicInfoProps) {
  const set = (key: keyof ClinicInfoData) => (value: string) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            onChange={(e) => set('ownerEmail')(e.target.value)}
            placeholder="owner@clinic.com"
            className={inputClass}
            required
          />
        </FormField>
      </div>

      <FormField label="Phone" id="phone">
        <input
          id="phone"
          type="tel"
          value={data.phone}
          onChange={(e) => set('phone')(e.target.value)}
          placeholder="+1 555-0100"
          className={inputClass}
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Plan" id="plan">
          <select id="plan" value={data.plan} onChange={(e) => set('plan')(e.target.value)} className={inputClass}>
            {PLAN_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Timezone" id="timezone">
          <select id="timezone" value={data.timezone} onChange={(e) => set('timezone')(e.target.value)} className={inputClass}>
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Locale" id="locale">
          <select id="locale" value={data.locale} onChange={(e) => set('locale')(e.target.value)} className={inputClass}>
            {LOCALE_OPTIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </FormField>
      </div>
    </div>
  );
}
