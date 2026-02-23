/**
 * Admin revenue section: MRR, credits revenue, total, failures, plan distribution.
 */

import { StatCard } from '../../../../shared/ui';
import type { AdminOverviewMetrics, PaymentFailure, PlanDistributionItem } from '../../../../shared/types';

interface AdminRevenueSectionProps {
  metrics: AdminOverviewMetrics;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AdminRevenueSection({ metrics }: AdminRevenueSectionProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Platform revenue
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="MRR (subscriptions)" value={formatCurrency(metrics.mrr)} />
        <StatCard label="Credits revenue (top-ups)" value={formatCurrency(metrics.creditsRevenue)} />
        <StatCard label="Total revenue" value={formatCurrency(metrics.totalRevenue)} />
        <StatCard label="Payment failures" value={metrics.paymentFailures.length} />
      </div>
      {metrics.planDistribution.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 min-h-[80px]">
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
            Active subscriptions / plan distribution
          </h3>
          <ul className="flex flex-wrap gap-3 text-sm">
            {metrics.planDistribution.map((p: PlanDistributionItem) => (
              <li
                key={p.plan}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
              >
                <span className="font-medium text-[var(--text-primary)]">{p.plan}</span>
                <span className="text-[var(--text-muted)]">{p.count} tenant{p.count !== 1 ? 's' : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {metrics.paymentFailures.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 min-h-[80px]">
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
            Recent payment failures
          </h3>
          <ul className="space-y-2 text-sm">
            {metrics.paymentFailures.map((f: PaymentFailure) => (
              <li key={f.id} className="flex flex-wrap items-center gap-2">
                <span className="text-[var(--text-primary)]">{f.tenantName}</span>
                <span className="text-[var(--text-muted)]">{formatCurrency(f.amount)}</span>
                <span className="text-[var(--text-muted)]">{formatDate(f.failedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
