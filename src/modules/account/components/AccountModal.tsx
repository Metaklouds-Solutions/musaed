/**
 * Manage account modal. Profile, Security (password, 2FA, session).
 * User identity and security live here—not in Settings (tenant/app config).
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalHeader } from '../../../shared/ui';
import { useSession } from '../../../app/session/SessionContext';
import { useAccountModal } from '../../../app/account/AccountModalContext';
import { gdprAdapter } from '../../../adapters';
import { User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfileTab } from './AccountModal/ProfileTab';
import { SecurityTab } from './AccountModal/SecurityTab';

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

        <div className="flex-1 min-w-0 overflow-y-auto max-h-[calc(90vh-80px)]">
          {activeTab === 'profile' && (
            <ProfileTab user={user} onExportMyData={handleExportMyData} />
          )}
          {activeTab === 'security' && (
            <SecurityTab
              user={user}
              securitySubTab={securitySubTab}
              onSecuritySubTabChange={setSecuritySubTab}
              currentPassword={currentPassword}
              onCurrentPasswordChange={setCurrentPassword}
              newPassword={newPassword}
              onNewPasswordChange={setNewPassword}
              confirmPassword={confirmPassword}
              onConfirmPasswordChange={setConfirmPassword}
              passwordSaved={passwordSaved}
              onPasswordSubmit={handlePasswordSubmit}
              deleteConfirm={deleteConfirm}
              onDeleteConfirmChange={setDeleteConfirm}
              onDeleteAccount={handleDeleteAccount}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
