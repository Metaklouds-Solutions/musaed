/**
 * Admin users section. List platform admins.
 */

import type { AdminUser } from '../../../../adapters/local/settings.adapter';

interface AdminUsersSectionProps {
  users: AdminUser[];
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function AdminUsersSection({ users }: AdminUsersSectionProps) {
  return (
    <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-4">
      <h3 className="font-semibold text-[var(--text-primary)]">Admin Users</h3>
      <p className="text-sm text-[var(--text-muted)]">
        Platform administrators with access to all tenants.
      </p>
      <div className="divide-y divide-[var(--border-subtle)]">
        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
          >
            <div>
              <p className="font-medium text-[var(--text-primary)]">{u.email}</p>
              <p className="text-sm text-[var(--text-muted)]">{u.role}</p>
              {u.lastActive && (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Last active: {formatDate(u.lastActive)}
                </p>
              )}
            </div>
            <button
              type="button"
              className="text-sm font-medium text-[var(--ds-primary)] hover:underline"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
