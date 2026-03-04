/**
 * Appointment reminders config. When to send reminders and via which channel.
 * Used when bookingReminders is enabled in Notifications.
 */

import { cn } from '@/lib/utils';
import { PopoverSelect } from '../../../../shared/ui';
import type { AppointmentRemindersConfig } from '../../../../adapters/local/settings.adapter';

const ADVANCE_OPTIONS = [
  { value: '15', label: '15 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '1440', label: '24 hours before' },
];

const CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
];

interface AppointmentRemindersSectionProps {
  config: AppointmentRemindersConfig;
  onChange: (config: AppointmentRemindersConfig) => void;
  disabled?: boolean;
}

export function AppointmentRemindersSection({
  config,
  onChange,
  disabled = false,
}: AppointmentRemindersSectionProps) {
  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <h3 className="font-semibold text-[var(--text-primary)]">Appointment Reminders</h3>
      <p className="text-sm text-[var(--text-muted)]">
        Configure when and how staff receive reminders for upcoming appointments.
      </p>
      <div className={cn('grid gap-4 sm:grid-cols-2', disabled && 'pointer-events-none opacity-60')}>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
            Send reminder
          </label>
          <PopoverSelect
            value={String(config.advanceMinutes)}
            onChange={(v) => onChange({ ...config, advanceMinutes: parseInt(v, 10) })}
            options={ADVANCE_OPTIONS}
            placeholder="Select timing"
            title="Reminder timing"
            aria-label="When to send appointment reminder"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
            Channel
          </label>
          <PopoverSelect
            value={config.channel}
            onChange={(v) => onChange({ ...config, channel: v as 'email' | 'sms' })}
            options={CHANNEL_OPTIONS}
            placeholder="Select channel"
            title="Delivery channel"
            aria-label="Reminder delivery channel"
          />
        </div>
      </div>
      {disabled && (
        <p className="text-xs text-[var(--text-muted)]">
          Enable &quot;Booking Reminders&quot; above to use this config.
        </p>
      )}
    </div>
  );
}
