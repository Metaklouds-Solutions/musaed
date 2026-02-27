/**
 * Top bar: neomorphic search bar (icon animates left→right on focus), theme, notifications, user.
 */

import { useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../session/SessionContext';
import { GlobalSearch } from '../../../components/GlobalSearch';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import {
  NotificationDrawer,
  type NotificationItem,
} from './NotificationDrawer';
import { UserMenu } from './UserMenu';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

export type Theme = 'light' | 'dark';

interface HeaderProps {
  theme: Theme;
  onThemeToggle: (newTheme?: Theme) => void;
}

const THEME_STORAGE_KEY = 'clinic-crm-theme';

export function Header({ theme, onThemeToggle }: HeaderProps) {
  const { t } = useTranslation();
  useSession(); // SessionProvider required for UserMenu
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications] = useState<NotificationItem[]>([]);
  const openNotifications = useCallback(() => setNotificationsOpen(true), []);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);

  const handleThemeChange = useCallback(
    (newTheme: Theme) => {
      onThemeToggle(newTheme);
    },
    [onThemeToggle]
  );

  return (
    <div
      className="h-[var(--topbar-height)] w-full flex items-center justify-between gap-3 sm:gap-4 px-3 sm:px-6 md:px-8 backdrop-blur-md sticky top-0 z-10 shrink-0 rounded-xl border border-(var(--separator)) bg-(var(--bg-base))"
    >
      <GlobalSearch placeholder={t('common.searchPlaceholder')} />

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <LanguageSwitcher />
        <AnimatedThemeToggler
          storageKey={THEME_STORAGE_KEY}
          onThemeToggle={handleThemeChange}
        />
        <button
          type="button"
          onClick={openNotifications}
          className="p-2 rounded-(var(--radius-nav)) relative hover:bg-(var(--bg-hover)) hover:text-(var(--text-primary)) focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] text-(var(--text-muted))"
          aria-label={t('common.notifications')}
          aria-expanded={notificationsOpen}
        >
          <Bell size={20} aria-hidden />
          {notifications.some((n) => n.unread) && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-(var(--primary))" aria-hidden />
          )}
        </button>
        <NotificationDrawer
          open={notificationsOpen}
          onClose={closeNotifications}
          items={notifications}
        />
        <UserMenu />
      </div>
    </div>
  );
}
