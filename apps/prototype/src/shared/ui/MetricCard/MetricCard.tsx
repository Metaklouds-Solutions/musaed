/**
 * MetricCard. Design.json: vertical layout — label, primary value, trend indicator, optional mini chart.
 * Reusable for dashboard KPIs and billing/summary metrics.
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '../Card';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  trend?: { value: number; positive: boolean };
  /** Optional mini visualization (e.g. sparkline) */
  children?: ReactNode;
  className?: string;
}

export function MetricCard({ label, value, trend, children, className }: MetricCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <span className="text-[20px] font-semibold leading-tight text-[var(--text-primary)]">
          {value}
        </span>
        {trend !== undefined && (
          <span
            className={cn(
              'text-xs font-medium',
              trend.positive ? 'text-[var(--success)]' : 'text-[var(--error)]'
            )}
          >
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </Card>
  );
}
