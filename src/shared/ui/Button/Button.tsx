/**
 * Button primitives. Design-system: primary, secondary, ghost, danger, success.
 * No business logic.
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
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors touch-manipulation ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--primary)] text-black hover:bg-[var(--primary-hover)] px-4 py-2',
  secondary:
    'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)] px-4 py-2',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] px-4 py-2',
  danger:
    'bg-[#DC2626] text-[#FAFAFA] hover:bg-[#B91C1C] px-4 py-2',
  success:
    'bg-[#16A34A] text-[#FAFAFA] hover:bg-[#15803D] px-4 py-2',
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
