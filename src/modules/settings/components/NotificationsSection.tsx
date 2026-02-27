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
      <div className="space-y-4">
        {items.map(({ key, label, desc }) => (
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
                checked={notifications[key]}
                onChange={(e) => update({ [key]: e.target.checked })}
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
