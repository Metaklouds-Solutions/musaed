/**
 * Notifications section. Email digest, ticket alerts, booking reminders.
 */

import type { TenantSettings } from '../../../adapters/local/settings.adapter';

interface NotificationsSectionProps {
  notifications: TenantSettings['notifications'];
  onChange: (notifications: TenantSettings['notifications']) => void;
}

export function NotificationsSection({
  notifications,
  onChange,
}: NotificationsSectionProps) {
  const update = (patch: Partial<TenantSettings['notifications']>) =>
    onChange({ ...notifications, ...patch });

  const items: { key: keyof TenantSettings['notifications']; label: string; desc: string }[] = [
    { key: 'emailDigest', label: 'Weekly Email Digest', desc: 'Summary of calls and bookings' },
    { key: 'ticketAlerts', label: 'Ticket Alerts', desc: 'Notify when support tickets are updated' },
    { key: 'bookingReminders', label: 'Booking Reminders', desc: 'Remind staff of upcoming appointments' },
  ];

  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
      <p className="text-sm text-[var(--text-muted)]">
        Configure how you receive updates.
      </p>
      <div className="space-y-3">
        {items.map(({ key, label, desc }) => (
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
                {notifications[key] ? 'On' : 'Off'}
              </span>
              <div className="relative w-11 h-6 rounded-full bg-[var(--border-subtle)] transition-colors has-[input:checked]:bg-[var(--ds-primary)]">
                <input
                  type="checkbox"
                  checked={notifications[key]}
                  onChange={(e) => update({ [key]: e.target.checked })}
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
