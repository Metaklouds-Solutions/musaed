/**
 * Conversion summary (non-revenue). Data from props only.
 */

import { StatCard } from '../../../../shared/ui';

interface ConversionSummaryProps {
  totalBookings: number;
  fromCalls: number;
}

export function ConversionSummary({ totalBookings, fromCalls }: ConversionSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <StatCard label="Total bookings" value={totalBookings} />
      <StatCard label="From calls" value={fromCalls} />
    </div>
  );
}
