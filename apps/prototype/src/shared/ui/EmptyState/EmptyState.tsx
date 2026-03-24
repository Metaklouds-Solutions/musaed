/**
 * EmptyState primitive. Design-system: icon or Lottie, text hierarchy, spacing.
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LottiePlayer, LOTTIE_ASSETS } from '../LottiePlayer';
import type { LottieAnimationData } from '../LottiePlayer';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: ReactNode;
  /** Optional Lottie animation URL (shows instead of icon when provided) */
  lottieSrc?: string | LottieAnimationData;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, lottieSrc, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className
      )}
    >
      <div
        className="w-24 h-24 flex items-center justify-center mb-6"
        aria-hidden
      >
        {lottieSrc ? (
          <LottiePlayer
            src={lottieSrc}
            width={96}
            height={96}
            loop
            fallback={
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
                <Icon className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
            }
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
            <Icon className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
        )}
      </div>
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
        {title}
      </h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md">
        {description}
      </p>
      {children}
    </div>
  );
}

