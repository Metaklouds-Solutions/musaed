/**
 * SkeletonCard: loading placeholder with optional Lottie animation.
 */

import { Skeleton } from '../Skeleton';
import { LottiePlayer, LOTTIE_ASSETS } from '../LottiePlayer';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  /** Show Lottie loading animation instead of skeleton bars */
  useLottie?: boolean;
}

export function SkeletonCard({ className, lines = 2, useLottie = false }: SkeletonCardProps) {
  if (useLottie) {
    return (
      <div
        className={cn(
          'rounded-[var(--radius-card)] overflow-hidden p-5',
          'bg-[var(--surface-card)] border border-[var(--border-subtle)]',
          'flex flex-col items-center justify-center min-h-[120px]',
          className
        )}
        role="presentation"
        aria-hidden
      >
        <LottiePlayer src={LOTTIE_ASSETS.loading} width={64} height={64} loop />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] overflow-hidden p-5',
        'bg-[var(--surface-card)] border border-[var(--border-subtle)]',
        'animate-pulse',
        className
      )}
      role="presentation"
      aria-hidden
    >
      <Skeleton className="h-3 w-24 rounded" />
      <Skeleton className="mt-3 h-6 w-16 rounded" />
      {lines > 2 && (
        <Skeleton className="mt-2 h-3 w-full rounded" />
      )}
    </div>
  );
}
