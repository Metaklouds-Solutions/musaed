/**
 * Button primitives. Design.json: primary = accent gradient + glow shadow;
 * secondary = glass (rgba(255,255,255,0.05) + border). Radius 12px, padding 10px 16px.
 */

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] font-medium min-h-[40px] px-4 py-2.5 ' +
  'transition-colors transition-shadow duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] touch-manipulation ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-[length:200%_200%] bg-[linear-gradient(135deg,var(--ds-accent-start)_0%,var(--ds-accent-end)_100%)] text-white ' +
    'shadow-[var(--shadow-button-primary)] hover:shadow-[0_6px_28px_var(--ds-accent-glow)] hover:brightness-105',
  secondary:
    'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[var(--text-primary)] ' +
    'hover:bg-[rgba(255,255,255,0.08)] dark:bg-[rgba(255,255,255,0.05)] dark:border-[rgba(255,255,255,0.1)]',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
  danger:
    'bg-[var(--error)] text-white hover:bg-[var(--error-muted)]',
  success:
    'bg-[var(--success)] text-white hover:bg-[var(--success-muted)]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled ?? loading}
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
