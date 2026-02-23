/**
 * Login: Admin or Tenant. No credentials (prototype). Session in memory.
 */

import { useState, useCallback, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Zap, Shield, User, Sun, Moon } from 'lucide-react';
import { useSession } from '../session/SessionContext';
import type { User as UserType } from '../../shared/types';
import type { Theme } from '../layout/Header';

const DEMO_ADMIN: UserType = {
  id: 'u_admin',
  email: 'admin@agentos.demo',
  name: 'Platform Admin',
  role: 'ADMIN',
};

const DEMO_TENANT_OWNER: UserType = {
  id: 'u_tenant_owner',
  email: 'owner@clinic.demo',
  name: 'Clinic Owner',
  role: 'TENANT_OWNER',
  tenantId: 't_001',
};

interface LoginPageProps {
  theme?: Theme;
  onThemeToggle?: () => void;
}

export function LoginPage({ theme: themeProp, onThemeToggle }: LoginPageProps) {
  const { isAuthenticated, user, login } = useSession();
  const [loading, setLoading] = useState(false);
  const [localTheme, setLocalTheme] = useState<Theme>(() =>
    typeof themeProp === 'string' ? themeProp : 'dark'
  );
  const theme = themeProp ?? localTheme;
  const isDark = theme === 'dark';

  useEffect(() => {
    if (themeProp == null) {
      document.documentElement.classList.toggle('dark', localTheme === 'dark');
      document.documentElement.style.colorScheme = localTheme;
    }
  }, [themeProp, localTheme]);

  const handleThemeToggle = useCallback(() => {
    if (onThemeToggle) {
      onThemeToggle();
    } else {
      setLocalTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    }
  }, [onThemeToggle]);

  const handleLogin = useCallback(
    (role: 'ADMIN' | 'TENANT_OWNER') => {
      setLoading(true);
      setTimeout(() => {
        login(role === 'ADMIN' ? DEMO_ADMIN : DEMO_TENANT_OWNER);
        setLoading(false);
      }, 600);
    },
    [login]
  );

  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/overview" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 relative">
      <button
        type="button"
        onClick={handleThemeToggle}
        className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary transition-colors"
        aria-label={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? <Sun size={22} /> : <Moon size={22} />}
      </button>
      <div className="max-w-md w-full space-y-8">
        <section className="text-center" aria-label="Welcome">
          <div
            className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6"
            aria-hidden
          >
            <Zap className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome to AgentOs
          </h1>
          <p className="mt-2 text-muted-foreground">
            Select a role to enter the prototype
          </p>
        </section>

        <div className="grid gap-4 mt-10">
          <button
            type="button"
            onClick={() => handleLogin('ADMIN')}
            disabled={loading}
            className="group flex items-center gap-4 p-4 sm:p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Login as Admin"
          >
            <div
              className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/20 shrink-0"
              aria-hidden
            >
              <Shield className="text-muted-foreground group-hover:text-primary" size={24} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-lg text-foreground">Admin</p>
              <p className="text-sm text-muted-foreground">
                Platform overview, tenants, system health
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleLogin('TENANT_OWNER')}
            disabled={loading}
            className="group flex items-center gap-4 p-4 sm:p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Login as Tenant"
          >
            <div
              className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/20 shrink-0"
              aria-hidden
            >
              <User className="text-muted-foreground group-hover:text-primary" size={24} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-lg text-foreground">Tenant</p>
              <p className="text-sm text-muted-foreground">
                Dashboard, calls, customers, billing
              </p>
            </div>
          </button>
        </div>

        {loading && (
          <div className="flex justify-center mt-8" aria-live="polite">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
