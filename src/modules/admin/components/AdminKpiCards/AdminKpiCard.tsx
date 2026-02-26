/**
 * Single KPI card for admin dashboard. Reuses StatCardEnhanced.
 */

import { StatCardEnhanced } from '../../../../shared/ui';

interface AdminKpiCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

export function AdminKpiCard({ label, value, trend }: AdminKpiCardProps) {
  return (
    <StatCardEnhanced
      label={label}
      value={value}
      trend={trend}
    />
  );
}
