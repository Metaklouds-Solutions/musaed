/**
 * Card primitive. Design.json: glass surface, 16px radius, soft elevation, hover -2px.
 * CardHeader/CardBody/CardFooter use 20px padding and separator borders.
 */

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const cardBase =
  'rounded-[var(--radius-card)] overflow-hidden ' +
  'bg-[var(--surface-card)] border border-[var(--surface-border-card,var(--border-subtle))] ' +
  'shadow-[var(--shadow-card)] ' +
  'transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ' +
  'hover:translate-y-[-2px] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--surface-border,var(--border-default))]';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(cardBase, className)} {...props} />
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
