/**
 * Single KPI card for tenant dashboard.
 */

import { StatCardEnhanced } from '../../../../shared/ui';

interface TenantKpiCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

/** Renders a single tenant KPI tile using the shared enhanced stat-card shell. */
export function TenantKpiCard({ label, value, trend }: TenantKpiCardProps) {
  return <StatCardEnhanced label={label} value={value} trend={trend} />;
}
