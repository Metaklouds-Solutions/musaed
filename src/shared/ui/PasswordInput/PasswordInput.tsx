/**
 * Password input with show/hide toggle (eye icon).
 */

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  inputClassName?: string;
}

export function PasswordInput({
  className,
  inputClassName,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <input
        type={visible ? 'text' : 'password'}
        className={cn(
          'w-full px-4 py-2.5 pr-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]',
          'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)] text-sm',
          inputClassName
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff size={18} aria-hidden />
        ) : (
          <Eye size={18} aria-hidden />
        )}
      </button>
    </div>
  );
}
