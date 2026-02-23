/**
 * Card primitive. Design-system: bg-card, border-subtle, radius 12px, sections.
 * No business logic.
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const card =
  'bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] overflow-hidden';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(card, className)} {...props} />
  )
);
Card.displayName = 'Card';

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-5 py-4 border-b border-[var(--separator)]', className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'px-5 py-4 border-t border-[var(--separator)] bg-[var(--bg-subtle)]',
        className
      )}
      {...props}
    />
  );
}
