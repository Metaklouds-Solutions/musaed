/**
 * Circular avatar with initials or image. Fallback: first 2 letters of name.
 */

import { cn } from '@/lib/utils';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const sizeClasses = size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm';
  const initials = getInitials(name);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-medium',
        'bg-[var(--ds-primary)]/20 text-[var(--ds-primary)]',
        sizeClasses,
        className
      )}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
