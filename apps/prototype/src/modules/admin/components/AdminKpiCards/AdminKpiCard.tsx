/**
 * Single KPI card for admin dashboard. Reuses StatCardEnhanced.
 */

import { StatCardEnhanced } from '../../../../shared/ui';

interface AdminKpiCardProps {
  label: string;
  value: string | number;
  animateValue?: number;
  format?: (n: number) => string;
  decimals?: number;
  trend?: 'up' | 'down' | 'neutral';
}

/** Renders a single admin KPI metric tile. */
export function AdminKpiCard({ label, value, animateValue, format, decimals, trend }: AdminKpiCardProps) {
  return (
    <StatCardEnhanced
      label={label}
      value={value}
      animateValue={animateValue}
      format={format}
      decimals={decimals}
      trend={trend}
    />
  );
}
