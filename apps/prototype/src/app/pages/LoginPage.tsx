import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { Zap, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../session/SessionContext';
import type { Theme } from '../layout/Header';
import FloatingLines from '../../components/FloatingLines';
import { Button } from '../../shared/ui';
import { api, setTokens } from '../../lib/apiClient';
import type { User as UserType } from '../../shared/types';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserType & { avatarUrl?: string };
}

interface LoginPageProps {
  theme?: Theme;
  onThemeToggle?: () => void;
}

export function LoginPage({ theme: themeProp, onThemeToggle }: LoginPageProps) {
  const { isAuthenticated, user, loginWithTokens, logout, restoring } = useSession();
  const location = useLocation();
  const stateMessage = (location.state as { message?: string } | null)?.message;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
        const data = await api.post<LoginResponse>('/auth/login', { email, password });
        setTokens(data.accessToken, data.refreshToken);
        loginWithTokens(data.accessToken, data.refreshToken, {
          id: String(data.user.id),
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          tenantId: data.user.tenantId,
          tenantRole: data.user.tenantRole,
        });
      } catch (err: unknown) {
        const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Login failed. Please try again.';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [email, password, loginWithTokens]
  );

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/overview" replace />;
    // Tenant users without tenantId must stay on login (breaks redirect loop with TenantGuard)
    const tenantRoles = ['TENANT_OWNER', 'STAFF'] as const;
    if (tenantRoles.includes(user.role as (typeof tenantRoles)[number]) && !user.tenantId) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
          <p className="text-[var(--text-muted)] text-center">
            {stateMessage ?? 'No tenant assigned. Contact your administrator.'}
          </p>
          <Button variant="secondary" onClick={logout}>
            Log out and try again
          </Button>
        </div>
      );
    }
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

      <button
        type="button"
        onClick={handleThemeToggle}
        className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-card/80 border border-border hover:bg-card transition-colors"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6"
            aria-hidden
          >
            <Zap className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome to MUSAED
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm space-y-2">
              <p>{error}</p>
              {error.toLowerCase().includes('disabled') && error.toLowerCase().includes('contact') && (
                <a
                  href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL ?? 'support@example.com'}?subject=Account%20Disabled%20-%20Access%20Request`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  Contact administrator
                </a>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              to="/auth/forgot-password"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
