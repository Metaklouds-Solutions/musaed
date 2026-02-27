/**
 * Login: Admin or Tenant. No credentials (prototype). Session in memory.
 */

import { useState, useCallback, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Zap, Shield, User, Sun, Moon } from 'lucide-react';
import { useSession } from '../session/SessionContext';
import type { User as UserType } from '../../shared/types';
import type { Theme } from '../layout/Header';
import FloatingLines from '../../components/FloatingLines';

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
  tenantRole: 'tenant_owner',
};

const DEMO_STAFF: UserType = {
  id: 'u_staff',
  email: 'staff@clinic.demo',
  name: 'Receptionist',
  role: 'STAFF',
  tenantId: 't_001',
  tenantRole: 'receptionist',
};

const DEMO_STAFF_AUDITOR: UserType = {
  id: 'u_auditor',
  email: 'auditor@clinic.demo',
  name: 'Auditor',
  role: 'STAFF',
  tenantId: 't_001',
  tenantRole: 'auditor',
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
    (user: UserType) => {
      setLoading(true);
      setTimeout(() => {
        login(user);
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <FloatingLines
          linesGradient={isDark ? ['#1e3a5f', '#6366f1', '#a78bfa'] : ['#93c5fd', '#6366f1', '#c4b5fd']}
          animationSpeed={0.8}
          interactive
          parallax
          mixBlendMode="screen"
        />
      </div>
      <div className="absolute inset-0 z-0 bg-background/70" aria-hidden />
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
      
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
            onClick={() => handleLogin(DEMO_ADMIN)}
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
            onClick={() => handleLogin(DEMO_TENANT_OWNER)}
            disabled={loading}
            className="group flex items-center gap-4 p-4 sm:p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Login as Tenant Owner"
          >
            <div
              className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/20 shrink-0"
              aria-hidden
            >
              <User className="text-muted-foreground group-hover:text-primary" size={24} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-lg text-foreground">Tenant Owner</p>
              <p className="text-sm text-muted-foreground">
                Dashboard, calls, customers, billing
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleLogin(DEMO_STAFF)}
            disabled={loading}
            className="group flex items-center gap-4 p-4 sm:p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Login as Staff"
          >
            <div
              className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/20 shrink-0"
              aria-hidden
            >
              <User className="text-muted-foreground group-hover:text-primary" size={24} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-lg text-foreground">Staff</p>
              <p className="text-sm text-muted-foreground">
                Receptionist — tenant portal
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleLogin(DEMO_STAFF_AUDITOR)}
            disabled={loading}
            className="group flex items-center gap-4 p-4 sm:p-6 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Login as Auditor"
          >
            <div
              className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/20 shrink-0"
              aria-hidden
            >
              <User className="text-muted-foreground group-hover:text-primary" size={24} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-lg text-foreground">Auditor</p>
              <p className="text-sm text-muted-foreground">
                Run events, debug console per call
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
    </div>
  );
}
