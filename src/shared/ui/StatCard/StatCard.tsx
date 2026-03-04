/**
 * StatCard primitive. Design.json: glass card, label (caption), primary value.
 * Uses shared Card + typography scale. For trend + chart use MetricCard.
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '../Card';

interface StatCardProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-[20px] font-semibold leading-tight text-[var(--text-primary)]">
        {value}
      </p>
    </Card>
  );
}
