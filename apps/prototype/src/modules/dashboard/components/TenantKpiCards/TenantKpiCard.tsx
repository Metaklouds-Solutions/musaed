/**
 * Single KPI card for tenant dashboard.
 */

import { StatCardEnhanced } from '../../../../shared/ui';

interface TenantKpiCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

export function TenantKpiCard({ label, value, trend }: TenantKpiCardProps) {
  return <StatCardEnhanced label={label} value={value} trend={trend} />;
}
