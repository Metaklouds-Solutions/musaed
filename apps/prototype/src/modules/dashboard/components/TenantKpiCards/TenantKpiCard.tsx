/**
 * Single KPI card for tenant dashboard.
 */

import { StatCardEnhanced } from '../../../../shared/ui';

interface TenantKpiCardProps {
  label: string;
  value: string | number;
  animateValue?: number;
  format?: (n: number) => string;
  decimals?: number;
  trend?: 'up' | 'down' | 'neutral';
}

/** Renders a single tenant KPI tile using the shared enhanced stat-card shell. */
export function TenantKpiCard({ label, value, animateValue, format, decimals, trend }: TenantKpiCardProps) {
  return <StatCardEnhanced label={label} value={value} animateValue={animateValue} format={format} decimals={decimals} trend={trend} />;
}
