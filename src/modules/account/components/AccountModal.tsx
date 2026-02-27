/**
 * Manage account modal. Profile (email), Security (password change).
 */

import { useState } from 'react';
import { Modal, ModalHeader, Button, PasswordInput } from '../../../shared/ui';
import { useSession } from '../../../app/session/SessionContext';
import { useAccountModal } from '../../../app/account/AccountModalContext';
import { User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccountTab = 'profile' | 'security';

export function AccountModal() {
  const { user } = useSession();
  const { open, closeModal } = useAccountModal();
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword || !newPassword) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  if (!user) return null;

  const tabs: { id: AccountTab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <Modal open={open} onClose={closeModal} title="Account" maxWidthRem={44}>
      <ModalHeader title="Account" onClose={closeModal} />
      <div className="flex flex-col sm:flex-row min-h-[520px] max-h-[90vh]">
        {/* Sidebar nav */}
        <nav className="sm:w-52 shrink-0 p-4 border-b sm:border-b-0 sm:border-r border-[var(--border-subtle)] space-y-1">
          <p className="text-xs text-[var(--text-muted)] mb-3 px-2">Manage your account info.</p>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer',
                activeTab === tab.id
                  ? 'bg-[var(--ds-primary)]/10 text-[var(--ds-primary)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              )}
            >
              <tab.icon size={18} className="shrink-0" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-y-auto max-h-[calc(90vh-80px)]">
          {activeTab === 'profile' && (
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
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6 space-y-6">
              <h3 className="font-semibold text-[var(--text-primary)]">Security</h3>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-[var(--text-muted)]">Password</span>
                  <button type="button" className="text-sm font-medium text-[var(--ds-primary)] cursor-pointer hover:underline">
                    Set password
                  </button>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
                    Current password
                  </label>
                  <PasswordInput
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
                    New password
                  </label>
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
                    Confirm new password
                  </label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!newPassword || newPassword !== confirmPassword}
                  className="cursor-pointer"
                >
                  {passwordSaved ? 'Saved' : 'Update password'}
                </Button>
              </form>

              <div className="border-t border-[var(--border-subtle)] pt-4">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Active devices
                </p>
                <p className="text-sm text-[var(--text-muted)] mb-2">
                  Manage your active sessions and devices.
                </p>
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm">
                  <p className="font-medium text-[var(--text-primary)]">Windows · This device</p>
                  <p className="text-[var(--text-muted)]">Chrome · Today</p>
                </div>
              </div>

              <div className="border-t border-[var(--border-subtle)] pt-4">
                <button
                  type="button"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-[var(--radius-button)] bg-[var(--error)] text-white font-medium text-sm hover:bg-[var(--error-muted)] cursor-pointer transition-colors"
                >
                  Delete account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
