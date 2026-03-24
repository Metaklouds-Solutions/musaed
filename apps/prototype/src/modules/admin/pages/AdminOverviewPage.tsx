/**
 * Admin dashboard: 3 zones — signal + health, platform pulse, recent activity.
 * Layout-only; data from useAdminOverview (adapter).
 */

import * as React from 'react';
import { motion } from 'motion/react';
import { PageHeader } from '../../../shared/ui';
import { DateRangePicker, type DateRange } from '../../../components/DateRangePicker';
import { AdminKpiCards } from '../components/AdminKpiCards';
import { AdminRecentTenants } from '../components/AdminRecentTenants';
import { AdminSupportSnapshot } from '../components/AdminSupportSnapshot';
import { AdminRecentCalls } from '../components/AdminRecentCalls';
import { AdminOverviewSkeleton } from '../components/AdminOverviewSkeleton';
import { useAdminOverview } from '../hooks';

const HEADER_ANIMATION = { duration: 0.3 };

function getInitialRange(): DateRange {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function isWithinRange(dateString: string, range: DateRange): boolean {
  const t = new Date(dateString).getTime();
  if (Number.isNaN(t)) return false;
  return t >= range.start.getTime() && t <= range.end.getTime();
}

function getDisplayName(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) return name.trim();
  if (email && email.includes('@')) return email.split('@')[0];
  return 'Admin';
}

/** Admin dashboard page. Platform pulse, tenants, support, calls. */
export function AdminOverviewPage() {
  const { user, kpis, recentTenants, supportSnapshot, recentCalls, loading } = useAdminOverview();
  const [dateRange, setDateRange] = React.useState<DateRange>(getInitialRange);
  const filteredRecentCalls = React.useMemo(
    () => recentCalls.filter((call) => isWithinRange(call.startedAt, dateRange)),
    [recentCalls, dateRange]
  );
  const filteredRecentTenants = React.useMemo(
    () => recentTenants.filter((tenant) => isWithinRange(tenant.createdAt, dateRange)),
    [recentTenants, dateRange]
  );
  const adminName = getDisplayName(user?.name, user?.email);

  if (loading) {
    return <AdminOverviewSkeleton />;
  }

  return (
    <div className="space-y-8">
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={HEADER_ANIMATION}
        className="rounded-[var(--radius-card)] panel-soft p-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <PageHeader title="Admin Dashboard" description="Platform pulse, tenants, and system health" />
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Welcome back, <span className="font-semibold text-[var(--text-primary)]">{adminName}</span>. Here is today&apos;s platform snapshot.
            </p>
          </div>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            mode="apply"
            presets={['7d', '30d', 'month', 'custom']}
            aria-label="Filter admin dashboard date range"
            className="w-full md:w-auto"
          />
        </div>
      </motion.header>

      <AdminKpiCards kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminRecentTenants tenants={filteredRecentTenants} />
        <AdminRecentCalls calls={filteredRecentCalls} />
      </div>

      <AdminSupportSnapshot snapshot={supportSnapshot} />
    </div>
  );
}

