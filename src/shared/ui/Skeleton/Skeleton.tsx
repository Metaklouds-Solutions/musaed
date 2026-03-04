/**
 * Skeleton primitive. Design-system: shimmer animation, radius 6px.
 * No business logic.
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      role="presentation"
      aria-hidden
    />
  );
}
