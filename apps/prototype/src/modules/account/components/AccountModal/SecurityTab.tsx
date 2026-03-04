/**
 * Account modal security tab. Password, 2FA, session sub-tabs.
 */

import { Key, ShieldCheck, Clock, Trash2 } from 'lucide-react';
import { Button, PasswordInput } from '../../../../shared/ui';
import { TwoFactorSection } from '../../../settings/components';
import { SessionManagementSection } from '../../../settings/components';
import { cn } from '@/lib/utils';
import type { User as SessionUser } from '../../../../shared/types';

type SecuritySubTab = 'password' | 'two-factor' | 'session';

interface SecurityTabProps {
  user: SessionUser;
  securitySubTab: SecuritySubTab;
  onSecuritySubTabChange: (tab: SecuritySubTab) => void;
  currentPassword: string;
  onCurrentPasswordChange: (v: string) => void;
  newPassword: string;
  onNewPasswordChange: (v: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (v: string) => void;
  passwordSaved: boolean;
  onPasswordSubmit: (e: React.FormEvent) => void;
  deleteConfirm: boolean;
  onDeleteConfirmChange: (v: boolean) => void;
  onDeleteAccount: () => void;
}

export function SecurityTab({
  user,
  securitySubTab,
  onSecuritySubTabChange,
  currentPassword,
  onCurrentPasswordChange,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  passwordSaved,
  onPasswordSubmit,
  deleteConfirm,
  onDeleteConfirmChange,
  onDeleteAccount,
}: SecurityTabProps) {
  const showTwoFactor = user.role === 'ADMIN' || user.role === 'TENANT_OWNER';

  return (
    <div className="p-6">
      <h3 className="font-semibold text-[var(--text-primary)] mb-4">Security</h3>

      <div className="flex flex-wrap gap-1 mb-6 p-1 rounded-lg bg-[var(--bg-subtle)] w-fit">
        <button
          type="button"
          onClick={() => onSecuritySubTabChange('password')}
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
        {showTwoFactor && (
          <button
            type="button"
            onClick={() => onSecuritySubTabChange('two-factor')}
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
          onClick={() => onSecuritySubTabChange('session')}
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
          <form onSubmit={onPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
                Current password
              </label>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => onCurrentPasswordChange(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
                New password
              </label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => onNewPasswordChange(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
                Confirm new password
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
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
                  <Button variant="danger" className="cursor-pointer" onClick={onDeleteAccount}>
                    Yes, delete
                  </Button>
                  <Button variant="secondary" className="cursor-pointer" onClick={() => onDeleteConfirmChange(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onDeleteConfirmChange(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)] bg-[var(--error)] text-white font-medium text-sm hover:bg-[var(--error-muted)] cursor-pointer transition-colors"
              >
                <Trash2 size={16} />
                Delete account
              </button>
            )}
          </div>
        </div>
      )}

      {securitySubTab === 'two-factor' && showTwoFactor && (
        <TwoFactorSection userId={user.id} userEmail={user.email} />
      )}

      {securitySubTab === 'session' && <SessionManagementSection />}
    </div>
  );
}
