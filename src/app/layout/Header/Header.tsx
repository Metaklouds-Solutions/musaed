/**
 * Top bar: page title from route, theme toggle, notifications drawer, user info.
 */

import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { useSession } from '../../session/SessionContext';
import {
  NotificationDrawer,
  type NotificationItem,
} from './NotificationDrawer';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

const PATH_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/calls': 'Calls',
  '/bookings': 'Bookings',
  '/customers': 'Customers',
  '/alerts': 'Alerts',
  '/billing': 'Billing',
  '/admin/overview': 'Platform Overview',
  '/admin/tenants': 'Tenants',
  '/admin/system': 'System Health',
};

function getTitle(pathname: string): string {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname];
  if (pathname.startsWith('/calls/')) return 'Call detail';
  if (pathname.startsWith('/customers/')) return 'Customer detail';
  return 'AgentOs';
}

export type Theme = 'light' | 'dark';

interface HeaderProps {
  theme: Theme;
  onThemeToggle: (newTheme?: Theme) => void;
}

const THEME_STORAGE_KEY = 'clinic-crm-theme';

export function Header({ theme, onThemeToggle }: HeaderProps) {
  const location = useLocation();
  const { user } = useSession();
  const title = getTitle(location.pathname);
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
      className="h-[var(--topbar-height)] w-full flex items-center justify-between gap-4 px-4 sm:px-6 md:px-8 backdrop-blur-md sticky top-0 z-10 shrink-0 border-b border-[var(--separator)] bg-[var(--bg-base)]"
    >
      <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
        <h1 className="text-[length:var(--typography-heading)] font-semibold truncate text-[var(--text-primary)]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <AnimatedThemeToggler
          storageKey={THEME_STORAGE_KEY}
          onThemeToggle={handleThemeChange}
        />
        <button
          type="button"
          onClick={openNotifications}
          className="p-2 rounded-[var(--radius-nav)] relative hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] text-[var(--text-muted)]"
          aria-label="Notifications"
          aria-expanded={notificationsOpen}
        >
          <Bell size={20} aria-hidden />
          {notifications.some((n) => n.unread) && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--primary)]" aria-hidden />
          )}
        </button>
        <NotificationDrawer
          open={notificationsOpen}
          onClose={closeNotifications}
          items={notifications}
        />
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-[var(--separator)]">
          <div className="text-right min-w-0 hidden sm:block">
            <p className="text-sm font-medium truncate text-[var(--text-primary)]">{user?.name}</p>
            <p className="text-xs truncate text-[var(--text-muted)]">{user?.role}</p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[var(--bg-elevated)]" aria-hidden>
            <User size={18} className="text-[var(--text-muted)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
