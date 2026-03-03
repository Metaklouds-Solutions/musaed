/**
 * User menu dropdown. Avatar, name, role (Tenant/Admin). Manage account, Logout.
 * On mobile: also shows theme toggle and language switcher (hidden in header).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { useAccountModal } from '../../account/AccountModalContext';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useSession } from '../../session/SessionContext';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

function getRoleLabel(role: string): string {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'TENANT_OWNER') return 'Tenant Owner';
  return 'Tenant';
}

interface UserMenuProps {
  themeStorageKey?: string;
  onThemeToggle?: (newTheme?: 'light' | 'dark') => void;
}

export function UserMenu({ themeStorageKey, onThemeToggle }: UserMenuProps) {
  const { t } = useTranslation();
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const { openModal } = useAccountModal();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const roleLabel = getRoleLabel(user.role);

  const handleManageAccount = () => {
    setOpen(false);
    openModal();
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className={cn(
          'flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-(var(--separator))',
          'rounded-lg px-2 py-1.5 -mr-2 sm:mr-0',
          'hover:bg-(var(--bg-hover)) transition-colors cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2'
        )}
        aria-label={t('userMenu.userMenu')}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[linear-gradient(135deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)] text-white">
          <User size={18} aria-hidden />
        </div>
        <div className="text-left min-w-0 hidden sm:block">
          <p className="text-sm font-medium truncate text-(var(--text-primary))">{user.name}</p>
          <p className="text-xs truncate text-(var(--text-muted))">{roleLabel}</p>
        </div>
        <ChevronDown
          className={cn('w-4 h-4 shrink-0 text-(var(--text-muted)) transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="bottom"
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 min-w-[220px]',
            'rounded-[var(--radius-card)] card-glass border border-(var(--border-subtle))',
            'p-2 shadow-lg'
          )}
        >
          <div className="px-3 py-2 border-b border-(var(--border-subtle)) mb-2">
            <p className="text-sm font-medium text-(var(--text-primary)) truncate">{user.name}</p>
            <p className="text-xs text-(var(--text-muted)) truncate">{user.email}</p>
          </div>
          {(themeStorageKey || onThemeToggle) && (
            <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-(var(--border-subtle)) mb-2">
              <LanguageSwitcher />
              {themeStorageKey && onThemeToggle && (
                <AnimatedThemeToggler
                  storageKey={themeStorageKey}
                  onThemeToggle={onThemeToggle}
                />
              )}
            </div>
          )}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={handleManageAccount}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm',
                'text-(var(--text-primary)) hover:bg-(var(--bg-hover)) transition-colors'
              )}
            >
              <Settings size={18} className="shrink-0 text-(var(--text-muted))" />
              {t('userMenu.manageAccount')}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm',
                'text-(var(--error)) hover:bg-(var(--bg-hover)) transition-colors'
              )}
            >
              <LogOut size={18} className="shrink-0" />
              {t('userMenu.logout')}
            </button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
