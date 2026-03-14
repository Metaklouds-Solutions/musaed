/**
 * Admin dashboard: 3 zones — signal + health, platform pulse, recent activity.
 * Layout-only; data from useAdminOverview (adapter).
 */

import { motion } from 'motion/react';
import { PageHeader } from '../../../shared/ui';
import { AdminKpiCards } from '../components/AdminKpiCards';
import { AdminRecentTenants } from '../components/AdminRecentTenants';
import { AdminSupportSnapshot } from '../components/AdminSupportSnapshot';
import { AdminRecentCalls } from '../components/AdminRecentCalls';
import { AdminSystemHealth } from '../components/AdminSystemHealth';
import { AdminOverviewSkeleton } from '../components/AdminOverviewSkeleton';
import { useAdminOverview } from '../hooks';
import { AlertTriangle, CheckCircle2, Radio } from 'lucide-react';

const HEADER_ANIMATION = { duration: 0.3 };

function getSignalTone(status: 'healthy' | 'warning' | 'empty') {
  if (status === 'warning') return 'warning';
  if (status === 'healthy') return 'positive';
  return 'neutral';
}

/** Admin dashboard page. Platform pulse, tenants, support, calls, health. */
export function AdminOverviewPage() {
  const { signal, health, kpis, recentTenants, supportSnapshot, recentCalls, loading } = useAdminOverview();
  const tone = getSignalTone(signal.status ?? 'empty');

  if (loading) {
    return <AdminOverviewSkeleton />;
  }

  return (
    <div className="space-y-8">
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={HEADER_ANIMATION}
        className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6"
      >
        <PageHeader title="Admin Dashboard" description="Platform pulse, tenants, and system health" />
      </motion.header>

      <section
        className={`rounded-[var(--radius-card)] border p-4 ${
          tone === 'warning'
            ? 'border-[var(--warning)]/40 bg-[color-mix(in_srgb,var(--warning)_8%,var(--bg-elevated))]'
            : tone === 'positive'
              ? 'border-emerald-500/30 bg-[color-mix(in_srgb,emerald_8%,var(--bg-elevated))]'
              : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/90'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 rounded-full p-2 ${
                tone === 'warning'
                  ? 'bg-[var(--warning)]/15 text-[var(--warning)]'
                  : tone === 'positive'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-[var(--ds-primary)]/15 text-[var(--ds-primary)]'
              }`}
            >
              {tone === 'warning' ? <AlertTriangle size={16} /> : tone === 'positive' ? <CheckCircle2 size={16} /> : <Radio size={16} />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">{signal.reason ?? 'No signal'}</h2>
            </div>
          </div>
          <AdminSystemHealth health={health} />
        </div>
      </section>

      <AdminKpiCards kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminRecentTenants tenants={recentTenants} />
        <AdminRecentCalls calls={recentCalls} />
      </div>

      <AdminSupportSnapshot snapshot={supportSnapshot} />
    </div>
  );
}
