/**
 * Single KPI card for admin dashboard. Reuses StatCardEnhanced.
 */

import { StatCardEnhanced } from '../../../../shared/ui';

interface AdminKpiCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

/** Renders a single admin KPI metric tile. */
export function AdminKpiCard({ label, value, trend }: AdminKpiCardProps) {
  return (
    <StatCardEnhanced
      label={label}
      value={value}
      trend={trend}
    />
  );
}
