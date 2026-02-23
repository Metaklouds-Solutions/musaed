/**
 * Top bar: page title from route, theme toggle, notifications drawer, user info.
 */

import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, Bell, User } from 'lucide-react';
import { useSession } from '../../session/SessionContext';
import {
  NotificationDrawer,
  type NotificationItem,
} from './NotificationDrawer';

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
  onThemeToggle: () => void;
}

export function Header({ theme, onThemeToggle }: HeaderProps) {
  const location = useLocation();
  const { user } = useSession();
  const title = getTitle(location.pathname);
  const isDark = theme === 'dark';
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications] = useState<NotificationItem[]>([]);
  const openNotifications = useCallback(() => setNotificationsOpen(true), []);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);

  return (
    <div
      className="h-14 sm:h-16 w-full flex mt-14 md:mt-0 items-center justify-between gap-4 px-4 sm:px-6 md:px-8 backdrop-blur-md sticky top-0 z-10 shrink-0"
      style={{
        borderBottom: '1px solid var(--separator)',
        background: 'var(--bg-base)',
      }}
    >
      <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
        <h1
          className="text-lg font-semibold truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <button
          type="button"
          onClick={onThemeToggle}
          className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
          style={{ color: 'var(--text-muted)' }}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? (
            <Sun size={20} aria-hidden />
          ) : (
            <Moon size={20} aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={openNotifications}
          className="p-2 rounded-lg relative hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Notifications"
          aria-expanded={notificationsOpen}
        >
          <Bell size={20} aria-hidden />
          {notifications.some((n) => n.unread) && (
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ background: 'var(--primary)' }}
              aria-hidden
            />
          )}
        </button>
        <NotificationDrawer
          open={notificationsOpen}
          onClose={closeNotifications}
          items={notifications}
        />
        <div
          className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3"
          style={{ borderLeft: '1px solid var(--separator)' }}
        >
          <div className="text-right min-w-0 hidden sm:block">
            <p
              className="text-sm font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {user?.name}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              {user?.role}
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-elevated)' }}
            aria-hidden
          >
            <User size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
