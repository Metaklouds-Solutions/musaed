import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { useSearchParams, Navigate, useNavigate, Link } from 'react-router-dom';
import { Zap, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../session/SessionContext';
import FloatingLines from '../../components/FloatingLines';
import { api, setTokens } from '../../lib/apiClient';
import type { User as UserType } from '../../shared/types';

interface VerifyResponse {
  valid: boolean;
  reason?: string;
  email?: string;
  name?: string;
  type?: string;
}

interface SetupResponse {
  accessToken: string;
  refreshToken: string;
  user: UserType & { avatarUrl?: string };
}

export function SetupPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, user, loginWithTokens } = useSession();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenReason, setTokenReason] = useState('');
  const [tokenEmail, setTokenEmail] = useState('');
  const [tokenName, setTokenName] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenReason('invalid');
      return;
    }

    api.get<VerifyResponse>(`/auth/verify-token?token=${token}`)
      .then((data) => {
        if (data.valid) {
          setTokenValid(true);
          setTokenEmail(data.email ?? '');
          setTokenName(data.name ?? '');
        } else {
          setTokenReason(data.reason ?? 'invalid');
        }
      })
      .catch(() => {
        setTokenReason('invalid');
      })
      .finally(() => setVerifying(false));
  }, [token]);

  const passwordStrength = useCallback((pw: string) => {
    if (pw.length < 8) return { label: 'Too short', color: 'bg-destructive' };
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasDigit = /\d/.test(pw);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
    const score = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
    if (score <= 2) return { label: 'Weak', color: 'bg-orange-500' };
    if (score === 3) return { label: 'Good', color: 'bg-yellow-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError('');

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }

      setLoading(true);
      try {
        const data = await api.post<SetupResponse>('/auth/setup-password', { token, password });
        setTokens(data.accessToken, data.refreshToken);
        loginWithTokens(data.accessToken, data.refreshToken, {
          id: String(data.user.id),
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          tenantId: data.user.tenantId,
          tenantRole: data.user.tenantRole,
        });
        toast.success('Account activated! Welcome aboard.');
        const dest = data.user.role === 'ADMIN' ? '/admin/overview' : '/dashboard';
        navigate(dest, { replace: true });
      } catch (err: any) {
        setError(err?.message ?? 'Failed to set password. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [token, password, confirmPassword, loginWithTokens, navigate]
  );

  if (isAuthenticated && user && !token) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/overview" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tokenValid) {
    return <Navigate to={`/auth/link-expired?reason=${tokenReason}`} replace />;
  }

  const strength = passwordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <FloatingLines
          linesGradient={['#1e3a5f', '#6366f1', '#a78bfa']}
          animationSpeed={0.8}
          interactive
          parallax
          mixBlendMode="screen"
        />
      </div>
      <div className="absolute inset-0 z-0 bg-background/70" aria-hidden />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6" aria-hidden>
            <Zap className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Set Up Your Password
          </h1>
          <p className="mt-2 text-muted-foreground">
            Welcome, {tokenName}! Create a password for <strong>{tokenEmail}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

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
                minLength={8}
                autoFocus
                placeholder="Choose a strong password"
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
            {password && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.label === 'Too short' ? '25%' : strength.label === 'Weak' ? '50%' : strength.label === 'Good' ? '75%' : '100%' }} />
                </div>
                <span className="text-xs text-muted-foreground">{strength.label}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Confirm your password"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
            {confirmPassword && password === confirmPassword && (
              <div className="flex items-center gap-1 text-green-600 text-xs mt-1">
                <CheckCircle size={14} />
                <span>Passwords match</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              'Activate Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
