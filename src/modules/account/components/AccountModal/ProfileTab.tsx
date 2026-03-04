/**
 * Account modal profile tab. User info, emails, connected accounts, GDPR actions.
 */

import { User, Download } from 'lucide-react';
import { Button } from '../../../../shared/ui';
import type { User as SessionUser } from '../../../../shared/types';

interface ProfileTabProps {
  user: SessionUser;
  onExportMyData: () => void;
}

export function ProfileTab({ user, onExportMyData }: ProfileTabProps) {
  return (
    <div className="p-6 space-y-6">
      <h3 className="font-semibold text-[var(--text-primary)]">Profile details</h3>
      <div className="flex flex-wrap items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[linear-gradient(135deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)] text-white shrink-0">
          <User size={28} />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-[var(--text-primary)] truncate">{user.name}</p>
          <p className="text-sm text-[var(--text-muted)] truncate">{user.email}</p>
        </div>
        <Button variant="secondary" className="ml-auto text-sm py-2 min-h-0 shrink-0 cursor-pointer">
          Update profile
        </Button>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
          Email addresses
        </label>
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <span className="text-sm text-[var(--text-primary)] truncate">{user.email}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] shrink-0">
            Primary
          </span>
          <button type="button" className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-pointer" aria-label="Options">
            <span className="text-lg leading-none">⋯</span>
          </button>
        </div>
        <button
          type="button"
          className="mt-2 text-sm font-medium text-[var(--ds-primary)] hover:underline cursor-pointer"
        >
          + Add email address
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
          Connected accounts
        </label>
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <span className="text-sm text-[var(--text-primary)]">Google • {user.email}</span>
          <button type="button" className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-pointer" aria-label="Options">
            <span className="text-lg leading-none">⋯</span>
          </button>
        </div>
      </div>
      <div className="border-t border-[var(--border-subtle)] pt-4 space-y-3">
        <p className="text-xs text-[var(--text-muted)]">GDPR: export or delete your data.</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="cursor-pointer flex items-center gap-2"
            onClick={onExportMyData}
          >
            <Download size={16} />
            Export my data
          </Button>
        </div>
      </div>
    </div>
  );
}
