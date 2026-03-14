import { useState, useCallback, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowLeft, Mail } from 'lucide-react';
import FloatingLines from '../../components/FloatingLines';
import { api } from '../../lib/apiClient';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
        await api.post('/auth/forgot-password', { email });
        setSent(true);
      } catch (err: any) {
        setError(err?.message ?? 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [email]
  );

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
            {sent ? 'Check Your Email' : 'Forgot Password'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {sent
              ? 'If an account exists with that email, we sent a password reset link.'
              : 'Enter your email and we\'ll send you a reset link.'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-5">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-2xl mx-auto">
                <Mail className="text-green-500 w-8 h-8" />
              </div>
              <p className="text-sm text-muted-foreground">
                The link will expire in 48 hours. If you don't see the email, check your spam folder.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft size={16} />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
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

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
