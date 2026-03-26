import { useSearchParams, Link } from 'react-router-dom';
import { Zap, AlertTriangle, ArrowLeft } from 'lucide-react';
import FloatingLines from '../../components/FloatingLines';

const REASON_TEXT: Record<string, { title: string; description: string }> = {
  expired: {
    title: 'Link Expired',
    description: 'This setup link expired after 48 hours. Ask your administrator to resend your invite, or request a password reset if your account was already activated.',
  },
  used: {
    title: 'Link Already Used',
    description: 'This setup link was already used. Your account may already be active, so try signing in with your password.',
  },
  invalid: {
    title: 'Invalid Link',
    description: 'This link is invalid or incomplete. Open the most recent invite email and use the full link.',
  },
};

export function LinkExpiredPage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') ?? 'invalid';
  const info = REASON_TEXT[reason] ?? REASON_TEXT.invalid;

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
            {info.title}
          </h1>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-muted-foreground">{info.description}</p>
          </div>

          <div className="space-y-3">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Go to Sign In
            </Link>

            <Link
              to="/auth/forgot-password"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border bg-background text-foreground font-medium hover:bg-muted transition-colors"
            >
              Request Password Reset
            </Link>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
