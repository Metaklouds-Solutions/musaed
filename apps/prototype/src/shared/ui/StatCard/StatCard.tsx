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
    <Card className={cn('metric-card p-3 sm:p-4', className)}>
      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1.5 text-[clamp(1.25rem,2vw,1.75rem)] font-semibold leading-tight tabular-nums text-[var(--text-primary)]">
        {value}
      </p>
    </Card>
  );
}
