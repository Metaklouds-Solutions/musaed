/**
 * Badge primitive. Design-system: Active, Pending, Inactive, Error (status badges).
 * No business logic.
 */

import { type ReactNode } from 'react';
import { CheckCircle, Clock, MinusCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'active' | 'pending' | 'inactive' | 'error';

const statusConfig: Record<
  Status,
  { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  active: {
    bg: 'rgba(34, 197, 94, 0.1)',
    text: '#22C55E',
    icon: CheckCircle,
  },
  pending: {
    bg: 'rgba(234, 179, 8, 0.1)',
    text: '#EAB308',
    icon: Clock,
  },
  inactive: {
    bg: 'rgba(113, 113, 122, 0.1)',
    text: '#71717A',
    icon: MinusCircle,
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.1)',
    text: '#EF4444',
    icon: XCircle,
  },
};

interface BadgeProps {
  status: Status;
  children: ReactNode;
  className?: string;
}

export function Badge({ status, children, className }: BadgeProps) {
  const { bg, text, icon: Icon } = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
        className
      )}
      style={{ background: bg, color: text }}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
      {children}
    </span>
  );
}
