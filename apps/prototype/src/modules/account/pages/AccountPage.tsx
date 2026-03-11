/**
 * Account management page. Profile editing, password change, account deletion.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader, Button } from '../../../shared/ui';
import { useSession } from '../../../app/session/SessionContext';
import { api } from '../../../lib/apiClient';
import { User, Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccountTab = 'profile' | 'security';

const INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] text-sm';

export function AccountPage() {
  const { user, logout, updateUser } = useSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleClose = useCallback(() => {
    const isAdmin = user?.role === 'ADMIN';
    navigate(isAdmin ? '/admin/overview' : '/dashboard');
  }, [user?.role, navigate]);

  const handleStartEdit = useCallback(() => {
    setProfileName(user?.name ?? '');
    setEditingProfile(true);
  }, [user?.name]);

  const handleSaveProfile = useCallback(async () => {
    if (!profileName.trim()) return;
    setProfileSaving(true);
    try {
      await api.patch('/auth/me', { name: profileName.trim() });
      updateUser({ name: profileName.trim() });
      setEditingProfile(false);
      toast.success('Profile updated');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to update profile';
      toast.error(message);
    } finally {
      setProfileSaving(false);
    }
  }, [profileName, updateUser]);

  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentPassword || !newPassword || newPassword !== confirmPassword) return;
      setPasswordLoading(true);
      try {
        await api.post('/auth/change-password', {
          currentPassword,
          newPassword,
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSaved(true);
        toast.success('Password updated');
        setTimeout(() => setPasswordSaved(false), 2000);
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Failed to update password';
        toast.error(message);
      } finally {
        setPasswordLoading(false);
      }
    },
    [currentPassword, newPassword, confirmPassword],
  );

  const handleDeleteAccount = useCallback(async () => {
    setDeleteLoading(true);
    try {
      await api.delete('/auth/me');
      toast.success('Account deleted');
      logout();
      navigate('/login');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to delete account';
      toast.error(message);
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  }, [logout, navigate]);

  if (!user) return null;

  const tabs: { id: AccountTab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Account" description="Manage your account info." />
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
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
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
                <div className="min-w-0 flex-1">
                  {editingProfile ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className={cn(INPUT_CLASS, 'flex-1')}
                        placeholder="Your name"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={!profileName.trim() || profileSaving}
                          className="text-sm py-2 min-h-0"
                        >
                          {profileSaving ? 'Saving…' : 'Save'}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setEditingProfile(false)}
                          className="text-sm py-2 min-h-0"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                      <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
                    </>
                  )}
                </div>
                {!editingProfile && (
                  <Button
                    variant="secondary"
                    onClick={handleStartEdit}
                    className="ml-auto text-sm py-2 min-h-0"
                  >
                    Update profile
                  </Button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
                  Email address
                </label>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <span className="text-sm text-[var(--text-primary)]">{user.email}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                    Primary
                  </span>
                </div>
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
                      className={INPUT_CLASS}
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
                      className={INPUT_CLASS}
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
                      className={INPUT_CLASS}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={
                      !currentPassword ||
                      !newPassword ||
                      newPassword !== confirmPassword ||
                      passwordLoading
                    }
                  >
                    {passwordLoading
                      ? 'Updating…'
                      : passwordSaved
                        ? 'Saved'
                        : 'Update password'}
                  </Button>
                </div>
              </form>

              <div className="border-t border-[var(--border-subtle)] pt-4">
                <p className="text-sm font-medium text-red-600 mb-2">Danger zone</p>
                {deleteConfirm ? (
                  <div className="p-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-900 space-y-3">
                    <p className="text-sm text-[var(--text-primary)]">
                      Are you sure? This will permanently disable your account and revoke all
                      sessions. This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                        className="text-sm"
                      >
                        {deleteLoading ? 'Deleting…' : 'Yes, delete my account'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setDeleteConfirm(false)}
                        className="text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="text-sm font-medium text-red-600 hover:underline"
                  >
                    Delete account
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
