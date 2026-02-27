/**
 * View button: Eye icon + label. Pill-shaped, light gray + shadow (light mode),
 * dark slate + white text (dark mode). Used for "View" and "View all" actions.
 */

import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ViewButtonBaseProps {
  children?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

interface ViewButtonAsLink extends ViewButtonBaseProps {
  to: string;
  onClick?: never;
}

interface ViewButtonAsButton extends ViewButtonBaseProps {
  to?: never;
  onClick: () => void;
}

type ViewButtonProps = ViewButtonAsLink | ViewButtonAsButton;

const viewButtonClasses =
  'inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium min-h-[44px] min-w-[44px] touch-manipulation ' +
  'transition-colors transition-shadow duration-200 ' +
  'bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-sm ' +
  'dark:bg-[#2B3342] dark:text-white dark:border-[rgba(255,255,255,0.1)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] ' +
  'hover:bg-[var(--bg-elevated)] hover:border-[var(--border-hover)] ' +
  'dark:hover:bg-[#343D4D] dark:hover:border-[rgba(255,255,255,0.15)] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]';

export function ViewButton({ children = 'View', className, 'aria-label': ariaLabel, ...props }: ViewButtonProps) {
  const label = ariaLabel ?? (typeof children === 'string' ? children : 'View');
  const content = (
    <>
      <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden />
      {children}
    </>
  );

  if ('to' in props && props.to) {
    const { to, ...linkProps } = props;
    return (
      <Link to={to} className={cn(viewButtonClasses, className)} aria-label={label} {...linkProps}>
        {content}
      </Link>
    );
  }

  const { onClick, ...buttonProps } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(viewButtonClasses, className)}
      aria-label={label}
      {...buttonProps}
    >
      {content}
    </button>
  );
}
