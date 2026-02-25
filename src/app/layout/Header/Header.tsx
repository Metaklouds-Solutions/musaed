/**
 * Top bar: neomorphic search bar (icon animates left→right on focus), theme, notifications, user.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Bell, Search, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useSession } from '../../session/SessionContext';
import {
  NotificationDrawer,
  type NotificationItem,
} from './NotificationDrawer';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { cn } from '@/lib/utils';

export type Theme = 'light' | 'dark';

interface HeaderProps {
  theme: Theme;
  onThemeToggle: (newTheme?: Theme) => void;
}

const THEME_STORAGE_KEY = 'clinic-crm-theme';

export function Header({ theme, onThemeToggle }: HeaderProps) {
  const { user } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchBarWidth, setSearchBarWidth] = useState(0);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const el = searchBarRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSearchBarWidth(el.offsetWidth));
    ro.observe(el);
    setSearchBarWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);
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
      className="h-[var(--topbar-height)] w-full flex items-center justify-between gap-3 sm:gap-4 px-3 sm:px-6 md:px-8 backdrop-blur-md sticky top-0 z-10 shrink-0 border-b border-(var(--separator)) bg-(var(--bg-base))"
    >
      {/* Search: only the icon moves left→right on focus; placeholder text stays fixed */}
      <div ref={searchBarRef} className="flex-1 min-w-0 max-w-[280px] sm:max-w-[320px]">
        <label htmlFor="header-search" className="sr-only">
          Search
        </label>
        <div
          className={cn(
            'relative flex items-center w-full rounded-full h-8 sm:h-9',
            'px-2.5 sm:px-3',
            'bg-(var(--header-search-bg))',
            'shadow-[var(--header-search-shadow)]',
            'focus-within:shadow-(var(--header-search-shadow-focus)) focus-within:ring-2 focus-within:ring-[var(--ds-primary)]/20',
            'transition-shadow duration-200'
          )}
        >
          <motion.div
            className="absolute top-1/2 flex shrink-0 w-6 h-6 rounded-full items-center justify-center bg-(var(--header-search-icon-bg)) text-(var(--ds-primary)) pointer-events-none"
            aria-hidden
            initial={false}
            animate={{
              x: searchFocused ? (searchBarWidth > 0 ? searchBarWidth - 10 - 24 - 10 : 0) : 0,
              left: 10,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{ width: 24, height: 24, y: '-50%' }}
          >
            <Search size={14} strokeWidth={2} />
          </motion.div>
          <input
            id="header-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search..."
            className={cn(
              'w-full min-w-0 bg-transparent border-0 outline-none text-(var(--text-primary))',
              'placeholder:text-(var(--text-muted)) text-sm',
              'pl-9 pr-2.5',
              searchFocused && 'pr-9'
            )}
            aria-label="Search"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <AnimatedThemeToggler
          storageKey={THEME_STORAGE_KEY}
          onThemeToggle={handleThemeChange}
        />
        <button
          type="button"
          onClick={openNotifications}
          className="p-2 rounded-(var(--radius-nav)) relative hover:bg-(var(--bg-hover)) hover:text-(var(--text-primary)) focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] text-(var(--text-muted))"
          aria-label="Notifications"
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
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-(var(--separator))">
          <div className="text-right min-w-0 hidden sm:block">
            <p className="text-sm font-medium truncate text-(var(--text-primary))">{user?.name}</p>
            <p className="text-xs truncate text-(var(--text-muted))">{user?.role}</p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-(var(--bg-elevated))" aria-hidden>
            <User size={18} className="text-(var(--text-muted))" />
          </div>
        </div>
      </div>
    </div>
  );
}
