/**
 * Top bar: page title, search, theme toggle, notifications, user info.
 * Stacks and shrinks on small screens for responsive layout.
 */

import React from 'react';
import Search from 'lucide-react/dist/esm/icons/search';
import Bell from 'lucide-react/dist/esm/icons/bell';
import User from 'lucide-react/dist/esm/icons/user';
import Sun from 'lucide-react/dist/esm/icons/sun';
import Moon from 'lucide-react/dist/esm/icons/moon';
import type { Theme } from '../App';

interface HeaderProps {
  title: string;
  user: { name: string; role: string } | null;
  theme: Theme;
  onThemeToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, user, theme, onThemeToggle }) => {
  const isDark = theme === 'dark';

  return (
    <div className="h-14 sm:h-16 border-b border-border w-full flex mt-14 md:mt-0 items-center justify-between gap-4 px-4 sm:px-6 md:px-8 bg-background/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
        <div className="relative hidden sm:block flex-1 max-w-xs min-w-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            size={18}
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search…"
            aria-label="Search"
            className="bg-background border border-border rounded-full pl-10 pr-4 py-2 text-sm w-full min-w-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <button
          type="button"
          onClick={onThemeToggle}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
        </button>
        <button
          type="button"
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg focus-visible:ring-2 focus-visible:ring-primary relative"
          aria-label="Notifications"
        >
          <Bell size={20} aria-hidden />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" aria-hidden />
        </button>
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-border">
          <div className="text-right min-w-0 hidden sm:block">
            <p className="text-sm font-medium truncate text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
          </div>
          <div
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0"
            aria-hidden
          >
            <User size={18} className="text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
};
