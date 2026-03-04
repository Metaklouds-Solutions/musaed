/**
 * Tenant detail Overview tab: profile, onboarding, quick stats.
 */

import { motion } from 'motion/react';
import { Card, CardHeader, CardBody, Badge, StatCard } from '../../../../shared/ui';
import type { TenantDetailFull } from '../../../../shared/types';

const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
  ACTIVE: 'active',
  TRIAL: 'pending',
  SUSPENDED: 'error',
};

interface TenantOverviewTabProps {
  tenant: TenantDetailFull;
}

/** Renders tenant profile, onboarding progress, and quick operational stats. */
export function TenantOverviewTab({ tenant }: TenantOverviewTabProps) {
  const { profile, onboarding, quickStats } = tenant;
  const badgeStatus = statusMap[profile.status] ?? 'inactive';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <Card variant="glass">
        <CardHeader className="text-base font-semibold text-[var(--text-primary)]">Profile</CardHeader>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-[var(--text-primary)]">{profile.clinicName}</span>
            <Badge status={badgeStatus}>{profile.status}</Badge>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Owner</dt>
              <dd className="font-medium text-[var(--text-primary)]">{profile.owner}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Email</dt>
              <dd className="font-medium text-[var(--text-primary)]">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Phone</dt>
              <dd className="font-medium text-[var(--text-primary)]">{profile.phone}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Address</dt>
              <dd className="font-medium text-[var(--text-primary)]">{profile.address}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Plan</dt>
              <dd className="font-medium text-[var(--text-primary)]">{profile.plan} · ${profile.mrr}/mo</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Created</dt>
              <dd className="font-medium text-[var(--text-primary)]">{profile.createdAt}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Last active</dt>
              <dd className="font-medium text-[var(--text-primary)]">{profile.lastActive}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card variant="glass">
        <CardHeader className="text-base font-semibold text-[var(--text-primary)]">Onboarding</CardHeader>
        <CardBody>
          <ul className="space-y-2">
            {onboarding.map((step) => (
              <li key={step.step} className="flex items-center gap-2 text-sm">
                <span
                  className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-medium ${
                    step.done ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
                  }`}
                >
                  {step.done ? '✓' : step.step}
                </span>
                <span className={step.done ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
                  {step.title}
                </span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="Total calls" value={quickStats.totalCalls} />
        <StatCard label="Bookings" value={quickStats.bookingsCreated} />
        <StatCard label="Escalations" value={quickStats.escalations} />
        <StatCard label="Conversion %" value={`${quickStats.conversionRate}%`} />
        <StatCard label="Avg duration" value={quickStats.avgCallDuration} />
        <StatCard label="Credits used" value={quickStats.creditsUsed} />
        <StatCard label="Credits left" value={quickStats.creditsRemaining} />
      </div>
    </motion.div>
  );
}
