/**
 * Shell: Sidebar + Header + main content. Design.json: sidebar 240px, topBar 64px, main padding 32px.
 * Keyboard shortcuts: G+D, G+C, G+T, G+S, ? for help.
 */

import { useState, useCallback, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header, type Theme } from './Header';
import { PageContent } from './PageContent';
import { AccountModalProvider } from '../account/AccountModalContext';
import { AccountModal } from '../../modules/account/components/AccountModal';
import { CommandPalette } from '../../components/CommandPalette';
import { MaintenanceBanner } from '../../components/MaintenanceBanner';
import { KeyboardShortcutsHelp } from '../../components/KeyboardShortcutsHelp';
import { useHotkeys } from '../../shared/hooks/useHotkeys';
import { useSession } from '../session/SessionContext';

const THEME_KEY = 'clinic-crm-theme';

function isTheme(s: string | null): s is Theme {
  return s === 'light' || s === 'dark';
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (isTheme(stored)) return stored;
  return window.matchMedia('prefers-color-scheme: dark').matches
    ? 'dark'
    : 'light';
}

export function MainLayout() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const navigate = useNavigate();
  const { user } = useSession();
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  useHotkeys([
    { key: 'k', meta: true, onTrigger: () => setCommandOpen((o) => !o) },
    { key: '?', onTrigger: () => setShortcutsOpen(true) },
    { key: 'g', sequence: 'd', onTrigger: () => navigate(isAdmin ? '/admin/overview' : '/dashboard') },
    { key: 'g', sequence: 'o', onTrigger: () => isAdmin && navigate('/admin/overview') },
    { key: 'g', sequence: 'c', onTrigger: () => navigate(isAdmin ? '/admin/calls' : '/calls') },
    { key: 'g', sequence: 't', onTrigger: () => isAdmin && navigate('/admin/tenants') },
    { key: 'g', sequence: 's', onTrigger: () => navigate(isAdmin ? '/admin/support' : '/help') },
  ]);

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
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="flex h-screen overflow-hidden bg-[var(--bg-base)] p-3 gap-3 box-border">
        <div className="w-0 min-w-0 overflow-visible md:w-auto md:min-w-0 shrink-0 self-stretch rounded-2xl overflow-hidden m-0 md:mb-3 md:ml-3 md:mr-3 md:mt-0">
          <Sidebar />
        </div>
        <main id="main-content" className="flex-1 flex flex-col overflow-hidden relative min-w-0 gap-3 pr-[82px] md:pr-0">
          <MaintenanceBanner />
          <Header
          theme={theme}
          onThemeToggle={onThemeToggle}
          onOpenCommandPalette={() => setCommandOpen(true)}
          onOpenShortcutsHelp={() => setShortcutsOpen(true)}
        />
          <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth py-8 min-h-0 min-w-0">
            <PageContent>
              <Outlet />
            </PageContent>
          </div>
        </main>
      </div>
      <AccountModal />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <KeyboardShortcutsHelp
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        isAdmin={isAdmin}
      />
    </AccountModalProvider>
  );
}
