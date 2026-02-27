/**
 * Shell: Sidebar + Header + main content. Design.json: sidebar 240px, topBar 64px, main padding 32px.
 */

import { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header, type Theme } from './Header';
import { PageContent } from './PageContent';
import { AccountModalProvider } from '../account/AccountModalContext';
import { AccountModal } from '../../modules/account/components/AccountModal';
import { CommandPalette } from '../../components/CommandPalette';

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
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const onThemeToggle = useCallback((newTheme?: Theme) => {
    if (newTheme !== undefined) {
      setTheme(newTheme);
    } else {
      setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    }
  }, []);

  return (
    <AccountModalProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--bg-base)] p-3 gap-3 box-border">
        <div className="shrink-0 self-stretch rounded-2xl overflow-hidden min-w-0 md:min-w-0 m-3">
          <Sidebar />
        </div>
        <main className="flex-1 flex flex-col overflow-hidden relative min-w-0 gap-3 pl-14 md:pl-0">
          <Header theme={theme} onThemeToggle={onThemeToggle} />
          <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth py-8 min-h-0 min-w-0">
            <PageContent>
              <Outlet />
            </PageContent>
          </div>
        </main>
      </div>
      <AccountModal />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </AccountModalProvider>
  );
}
