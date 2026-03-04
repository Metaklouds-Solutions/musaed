/**
 * Admin tenant comparison. Compare metrics across 2 tenants for a date range.
 * Responsive, polished UI with glass card and smooth animations.
 */

import { motion } from 'motion/react';
import { GitCompare } from 'lucide-react';
import { PopoverSelect, Card, CardHeader, CardBody } from '../../../../shared/ui';
import { DateRangePicker } from '../../../../components/DateRangePicker';
import type { TenantComparisonRow } from '../../../../shared/types/reports';
import { cn } from '@/lib/utils';
import { useTenantComparison } from '../../hooks';

type MetricKey = keyof Pick<TenantComparisonRow, 'totalCalls' | 'totalBookings' | 'conversionRate' | 'escalationRate' | 'avgDurationSec' | 'sentimentAvg'>;

const METRIC_ROWS: { key: MetricKey; label: string; format: (v: number) => string; color: string }[] = [
  { key: 'totalCalls', label: 'Calls', format: (v: number) => v.toString(), color: '' },
  { key: 'totalBookings', label: 'Bookings', format: (v: number) => v.toString(), color: 'text-[var(--success)]' },
  { key: 'conversionRate', label: 'Conversion %', format: (v: number) => `${v}%`, color: '' },
  { key: 'escalationRate', label: 'Escalation %', format: (v: number) => `${v}%`, color: 'text-[var(--warning)]' },
  { key: 'avgDurationSec', label: 'Avg duration', format: formatDuration, color: 'text-[var(--text-secondary)]' },
  { key: 'sentimentAvg', label: 'Sentiment', format: (v: number) => v.toFixed(2), color: '' },
];

interface TenantComparisonViewProps {
  /** Optional: use parent's date range (e.g. when embedded in Admin Tenants) */
  dateRange?: { start: Date; end: Date };
  onDateRangeChange?: (range: { start: Date; end: Date }) => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function TenantComparisonView({
  dateRange: controlledDateRange,
  onDateRangeChange,
}: TenantComparisonViewProps = {}) {
  const {
    tenantA,
    setTenantA,
    tenantB,
    setTenantB,
    dateRange,
    setDateRange,
    tenantOptions,
    rows,
  } = useTenantComparison(controlledDateRange, onDateRangeChange);

  const hasComparison = rows.length >= 2;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[var(--bg-elevated)]/80 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--ds-primary)]/10">
                <GitCompare className="w-5 h-5 text-[var(--ds-primary)]" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Compare Tenants
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Side-by-side call metrics
                </p>
              </div>
            </div>
            {!onDateRangeChange && (
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                aria-label="Date range for comparison"
              />
            )}
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          <p className="text-sm text-[var(--text-muted)]">
            Select two tenants to compare call metrics side by side.
          </p>

          {/* Tenant selectors - responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                Tenant A
              </label>
              <PopoverSelect
                value={tenantA}
                onChange={setTenantA}
                options={tenantOptions}
                placeholder="Select tenant…"
                aria-label="Select first tenant"
                triggerClassName="w-full min-w-0"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">
                Tenant B
              </label>
              <PopoverSelect
                value={tenantB}
                onChange={setTenantB}
                options={tenantOptions}
                placeholder="Select tenant…"
                aria-label="Select second tenant"
                triggerClassName="w-full min-w-0"
              />
            </div>
          </div>

          {/* Comparison table or empty state */}
          {hasComparison ? (
            <div className="rounded-xl overflow-x-auto border border-[var(--border-subtle)] shadow-inner">
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full min-w-[400px] text-sm">
                  <thead>
                    <tr className="border-b-2 border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50">
                      <th className="text-left py-4 px-4 font-semibold text-[var(--text-secondary)] w-36 sm:w-40">
                        Metric
                      </th>
                      {rows.map((r) => (
                        <th
                          key={r.tenantId}
                          className="text-right py-4 px-4 font-semibold text-[var(--text-primary)]"
                        >
                          {r.tenantName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {METRIC_ROWS.map(({ key, label, format, color }, rowIndex) => (
                      <tr
                        key={key}
                        className={cn(
                          'border-b border-[var(--border-subtle)]/50 transition-colors hover:bg-[var(--bg-hover)]/20',
                          rowIndex % 2 === 1 && 'bg-[var(--bg-subtle)]/20'
                        )}
                      >
                        <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">
                          {label}
                        </td>
                        {rows.map((r) => (
                          <td
                            key={r.tenantId}
                            className={cn(
                              'py-3 px-4 text-right tabular-nums font-medium',
                              color
                            )}
                          >
                            {format(r[key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-6 rounded-xl bg-[var(--bg-subtle)]/40 border border-dashed border-[var(--border-subtle)]">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
                <GitCompare className="w-6 h-6 text-[var(--text-muted)]" aria-hidden />
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)] text-center">
                Select two different tenants to compare
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1 text-center max-w-[280px]">
                Choose Tenant A and Tenant B above to see metrics side by side
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </motion.section>
  );
}
