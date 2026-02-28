/**
 * Manage account modal. Profile, Security (password, 2FA, session).
 * User identity and security live here—not in Settings (tenant/app config).
 * Security has sub-tabs so each area stays clean (no mess in password area).
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalHeader, Button, PasswordInput } from '../../../shared/ui';
import { useSession } from '../../../app/session/SessionContext';
import { useAccountModal } from '../../../app/account/AccountModalContext';
import { TwoFactorSection } from '../../../modules/settings/components';
import { SessionManagementSection } from '../../../modules/settings/components';
import { gdprAdapter } from '../../../adapters';
import { User, Shield, Key, ShieldCheck, Clock, Download, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccountTab = 'profile' | 'security';
type SecuritySubTab = 'password' | 'two-factor' | 'session';

export function AccountModal() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const { open, closeModal } = useAccountModal();
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');
  const [securitySubTab, setSecuritySubTab] = useState<SecuritySubTab>('password');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleExportMyData = useCallback(() => {
    if (user) {
      gdprAdapter.exportUserData(user);
      closeModal();
    }
  }, [user, closeModal]);

  const handleDeleteAccount = useCallback(() => {
    if (!user) return;
    gdprAdapter.deleteUserData(user.id, () => {
      closeModal();
      logout();
      navigate('/login');
    });
  }, [user, closeModal, logout, navigate]);

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
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'security') setSecuritySubTab('password');
              }}
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
              <div className="border-t border-[var(--border-subtle)] pt-4 space-y-3">
                <p className="text-xs text-[var(--text-muted)]">GDPR: export or delete your data.</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="cursor-pointer flex items-center gap-2"
                    onClick={handleExportMyData}
                  >
                    <Download size={16} />
                    Export my data
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">Security</h3>

              {/* Security sub-tabs: Password | Two-factor | Session */}
              <div className="flex flex-wrap gap-1 mb-6 p-1 rounded-lg bg-[var(--bg-subtle)] w-fit">
                <button
                  type="button"
                  onClick={() => setSecuritySubTab('password')}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
                    securitySubTab === 'password'
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <Key size={16} />
                  Password
                </button>
                {(user.role === 'ADMIN' || user.role === 'TENANT_OWNER') && (
                  <button
                    type="button"
                    onClick={() => setSecuritySubTab('two-factor')}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
                      securitySubTab === 'two-factor'
                        ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <ShieldCheck size={16} />
                    Two-factor
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSecuritySubTab('session')}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
                    securitySubTab === 'session'
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <Clock size={16} />
                  Session
                </button>
              </div>

              {securitySubTab === 'password' && (
                <div className="space-y-6">
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
                    {deleteConfirm ? (
                      <div className="space-y-2">
                        <p className="text-sm text-[var(--text-muted)]">Permanently delete your account and data?</p>
                        <div className="flex gap-2">
                          <Button
                            variant="danger"
                            className="cursor-pointer"
                            onClick={handleDeleteAccount}
                          >
                            Yes, delete
                          </Button>
                          <Button
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => setDeleteConfirm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)] bg-[var(--error)] text-white font-medium text-sm hover:bg-[var(--error-muted)] cursor-pointer transition-colors"
                      >
                        <Trash2 size={16} />
                        Delete account
                      </button>
                    )}
                  </div>
                </div>
              )}

              {securitySubTab === 'two-factor' && (user.role === 'ADMIN' || user.role === 'TENANT_OWNER') && (
                <TwoFactorSection userId={user.id} userEmail={user.email} />
              )}

              {securitySubTab === 'session' && <SessionManagementSection />}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
