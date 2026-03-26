/**
 * Top bar: neomorphic search bar (icon animates left→right on focus), theme, notifications, user.
 */

import { useState, useCallback, useEffect } from 'react';
import { Bell, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../session/SessionContext';
import { useNotifications } from '../../../hooks/useNotifications';
import { GlobalSearch } from '../../../components/GlobalSearch';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { NotificationDrawer } from './NotificationDrawer';
import { UserMenu } from './UserMenu';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

export type Theme = 'light' | 'dark';

interface HeaderProps {
  theme: Theme;
  onThemeToggle: (newTheme?: Theme) => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcutsHelp?: () => void;
}

const THEME_STORAGE_KEY = 'clinic-crm-theme';

export function Header({ theme, onThemeToggle, onOpenCommandPalette, onOpenShortcutsHelp }: HeaderProps) {
  const { t } = useTranslation();
  useSession(); // SessionProvider required for UserMenu
  const { items: notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, bellPulse } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isBellAnimating, setIsBellAnimating] = useState(false);
  const openNotifications = useCallback(() => setNotificationsOpen(true), []);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);

  const handleThemeChange = useCallback(
    (newTheme: Theme) => {
      onThemeToggle(newTheme);
    },
    [onThemeToggle]
  );

  useEffect(() => {
    if (bellPulse <= 0) return;
    setIsBellAnimating(true);
    const id = window.setTimeout(() => setIsBellAnimating(false), 700);
    return () => window.clearTimeout(id);
  }, [bellPulse]);

  return (
    <div
      className="h-[var(--topbar-height)] w-full flex items-center justify-between gap-3 sm:gap-4 px-3 sm:px-6 md:px-8 md:backdrop-blur-md sticky top-0 z-10 shrink-0 rounded-xl border border-(var(--separator)) bg-(var(--bg-base))"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <GlobalSearch
        placeholder={t('common.searchPlaceholder')}
        onOpenCommandPalette={onOpenCommandPalette}
      />
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {onOpenShortcutsHelp && (
          <button
            type="button"
            onClick={onOpenShortcutsHelp}
            className="hidden sm:flex p-2 rounded-(var(--radius-nav)) hover:bg-(var(--bg-hover)) hover:text-(var(--text-primary)) focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] text-(var(--text-muted))"
            aria-label={t('shortcuts.showHelp', 'Show keyboard shortcuts')}
            title={t('shortcuts.showHelp', 'Show keyboard shortcuts')}
          >
            <HelpCircle size={20} aria-hidden />
          </button>
        )}
        <div className="hidden md:block">
          <LanguageSwitcher />
        </div>
        <div className="hidden md:block">
          <AnimatedThemeToggler
            storageKey={THEME_STORAGE_KEY}
            onThemeToggle={handleThemeChange}
          />
        </div>
        <button
          type="button"
          onClick={openNotifications}
          className={`p-2 rounded-(var(--radius-nav)) relative hover:bg-(var(--bg-hover)) hover:text-(var(--text-primary)) focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] text-(var(--text-muted)) ${isBellAnimating ? 'animate-pulse' : ''}`}
          aria-label={t('common.notifications')}
          aria-expanded={notificationsOpen}
        >
          <Bell size={20} aria-hidden />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[var(--ds-primary)] text-white text-[10px] leading-5 text-center font-semibold"
              aria-hidden
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <NotificationDrawer
          open={notificationsOpen}
          onClose={closeNotifications}
          items={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClearAll={clearNotifications}
        />
        <UserMenu
          themeStorageKey={THEME_STORAGE_KEY}
          onThemeToggle={handleThemeChange}
        />
      </div>
    </div>
  );
}
