/**
 * Admin dashboard: recent tenants feed list (stacked, no table).
 */

import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ViewButton, PillTag } from '../../../../shared/ui';
import type { AdminRecentTenant } from '../../../../shared/types';

interface AdminRecentTenantsProps {
  tenants: AdminRecentTenant[];
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusPill({ status }: { status: AdminRecentTenant['status'] }) {
  const variant = status === 'ACTIVE' ? 'status' : status === 'TRIAL' ? 'outcome' : 'outcomeFailed';
  return <PillTag variant={variant}>{status}</PillTag>;
}

/** Renders recent tenant records as stacked feed list. */
export function AdminRecentTenants({ tenants }: AdminRecentTenantsProps) {
  if (tenants.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-[var(--radius-card)] card-glass p-6"
      >
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Tenants</h2>
        <p className="text-sm text-[var(--text-muted)]">No tenants yet.</p>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="rounded-[var(--radius-card)] card-glass p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Tenants</h2>
        <ViewButton to="/admin/tenants">View all</ViewButton>
      </div>
      <ul className="space-y-2">
        {tenants.map((t) => (
          <li key={t.id} className="rounded-lg bg-[var(--ds-primary)]/10 px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <Link
                to={`/admin/tenants/${t.id}`}
                className="font-medium text-[var(--ds-primary)] hover:underline truncate min-w-0"
              >
                {t.name}
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <StatusPill status={t.status} />
                <span className="text-sm text-[var(--text-muted)]">{formatDate(t.createdAt)}</span>
              </div>
            </div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Plan: {t.plan} · Onboarding: {t.onboardingProgress}%
            </p>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
