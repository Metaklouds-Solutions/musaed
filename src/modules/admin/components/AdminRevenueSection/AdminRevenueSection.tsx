/**
 * Admin revenue section: MRR, credits revenue, total, failures, plan distribution.
 * Uses StatCardEnhanced with stagger animations.
 */

import { motion } from 'motion/react';
import { StatCardEnhanced } from '../../../../shared/ui';
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
  const sparklineFromPlans = metrics.planDistribution.length > 0
    ? metrics.planDistribution.map((p) => p.count)
    : undefined;

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Platform revenue
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardEnhanced
          label="MRR (subscriptions)"
          value={formatCurrency(metrics.mrr)}
          sparklineData={sparklineFromPlans}
        />
        <StatCardEnhanced
          label="Credits revenue (top-ups)"
          value={formatCurrency(metrics.creditsRevenue)}
        />
        <StatCardEnhanced
          label="Total revenue"
          value={formatCurrency(metrics.totalRevenue)}
          trend={metrics.totalRevenue > 0 ? 'up' : 'neutral'}
        />
        <StatCardEnhanced
          label="Payment failures"
          value={metrics.paymentFailures.length}
          trend={metrics.paymentFailures.length > 0 ? 'down' : 'neutral'}
        />
      </div>
      {metrics.planDistribution.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 min-h-[80px]"
        >
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
            Active subscriptions / plan distribution
          </h3>
          <ul className="flex flex-wrap gap-3 text-sm">
            {metrics.planDistribution.map((p: PlanDistributionItem, i) => (
              <motion.li
                key={p.plan}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.1 + i * 0.03 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:border-[var(--border-default)] transition-colors"
              >
                <span className="font-medium text-[var(--text-primary)]">{p.plan}</span>
                <span className="text-[var(--text-muted)]">{p.count} tenant{p.count !== 1 ? 's' : ''}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
      {metrics.paymentFailures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 min-h-[80px]"
        >
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
            Recent payment failures
          </h3>
          <ul className="space-y-2 text-sm">
            {metrics.paymentFailures.map((f: PaymentFailure, i) => (
              <motion.li
                key={f.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.1 + i * 0.05 }}
                className="flex flex-wrap items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors cursor-default"
              >
                <span className="font-medium text-[var(--text-primary)]">{f.tenantName}</span>
                <span className="text-[var(--text-muted)]">{formatCurrency(f.amount)}</span>
                <span className="text-[var(--text-muted)]">{formatDate(f.failedAt)}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </section>
  );
}
