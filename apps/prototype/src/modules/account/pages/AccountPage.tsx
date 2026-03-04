/**
 * Manage account page. Profile details, Security (password change).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button } from '../../../shared/ui';
import { useSession } from '../../../app/session/SessionContext';
import { User, Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccountTab = 'profile' | 'security';

export function AccountPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleClose = () => {
    const isAdmin = user?.role === 'ADMIN';
    navigate(isAdmin ? '/admin/overview' : '/dashboard');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword || !newPassword) return;
    // In-memory prototype: just simulate save
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

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] text-sm';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Account"
          description="Manage your account info."
        />
        <Button
          variant="ghost"
          onClick={handleClose}
          aria-label="Close"
          className="shrink-0 p-2 min-h-0"
        >
          <X size={20} />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="sm:w-48 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
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
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-6">
              <h3 className="font-semibold text-[var(--text-primary)]">Profile details</h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[linear-gradient(135deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)] text-white">
                  <User size={28} />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
                </div>
                <Button variant="secondary" className="ml-auto text-sm py-2 min-h-0">
                  Update profile
                </Button>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
                  Email addresses
                </label>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <span className="text-sm text-[var(--text-primary)]">{user.email}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                    Primary
                  </span>
                </div>
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-[var(--ds-primary)] hover:underline"
                >
                  + Add email address
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="rounded-[var(--radius-card)] card-glass p-6 space-y-6">
              <h3 className="font-semibold text-[var(--text-primary)]">Security</h3>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
                    Password
                  </label>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[var(--text-secondary)]">
                      Set a password to sign in with email
                    </span>
                    <span className="text-sm font-medium text-[var(--ds-primary)] cursor-pointer hover:underline">
                      Set password
                    </span>
                  </div>
                </div>

                <div className="border-t border-[var(--border-subtle)] pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
                      Current password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
                      New password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!newPassword || newPassword !== confirmPassword}
                  >
                    {passwordSaved ? 'Saved' : 'Update password'}
                  </Button>
                </div>
              </form>

              <div className="border-t border-[var(--border-subtle)] pt-4">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Active devices
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  Manage your active sessions and devices.
                </p>
              </div>

              <div className="border-t border-[var(--border-subtle)] pt-4">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Delete account
                </p>
                <button
                  type="button"
                  className="text-sm font-medium text-[var(--error)] hover:underline"
                >
                  Delete account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
