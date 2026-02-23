/**
 * Shell: Sidebar + Header + main content outlet. No business logic.
 */

import { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header, type Theme } from './Header';

const THEME_KEY = 'clinic-crm-theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('prefers-color-scheme: dark').matches
    ? 'dark'
    : 'light';
}

export function MainLayout() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const onThemeToggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative min-w-0 pl-14 md:pl-0">
        <Header theme={theme} onThemeToggle={onThemeToggle} />
        <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
