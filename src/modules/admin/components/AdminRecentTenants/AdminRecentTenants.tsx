/**
 * Admin dashboard: recent tenants table.
 */

import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../shared/ui';
import { Badge } from '../../../../shared/ui';
import type { AdminRecentTenant } from '../../../../shared/types';

interface AdminRecentTenantsProps {
  tenants: AdminRecentTenant[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }: { status: AdminRecentTenant['status'] }) {
  const badgeStatus = status === 'ACTIVE' ? 'active' : status === 'TRIAL' ? 'pending' : 'error';
  return <Badge status={badgeStatus}>{status}</Badge>;
}

export function AdminRecentTenants({ tenants }: AdminRecentTenantsProps) {
  if (tenants.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6"
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
      className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden"
    >
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Tenants</h2>
        <Link
          to="/admin/tenants"
          className="text-sm font-medium text-[var(--ds-primary)] hover:underline"
        >
          View all
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Onboarding</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link to={`/admin/tenants/${t.id}`} className="font-medium text-[var(--ds-primary)] hover:underline">
                  {t.name}
                </Link>
              </TableCell>
              <TableCell>{t.plan}</TableCell>
              <TableCell><StatusBadge status={t.status} /></TableCell>
              <TableCell className="text-[var(--text-muted)]">{formatDate(t.createdAt)}</TableCell>
              <TableCell>{t.onboardingProgress}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.section>
  );
}
