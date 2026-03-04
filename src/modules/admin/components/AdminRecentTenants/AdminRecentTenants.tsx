/**
 * Admin dashboard: recent tenants table.
 */

import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { DataTable, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, ViewButton, PillTag } from '../../../../shared/ui';
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

/** Renders recent tenant records with status and onboarding progress. */
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
      className="rounded-[var(--radius-card)] card-glass overflow-x-auto"
    >
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Tenants</h2>
        <ViewButton to="/admin/tenants">View all</ViewButton>
      </div>
      <DataTable minWidth="min-w-[480px]">
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
              <TableCell><StatusPill status={t.status} /></TableCell>
              <TableCell className="text-[var(--text-muted)]">{formatDate(t.createdAt)}</TableCell>
              <TableCell>{t.onboardingProgress}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </DataTable>
    </motion.section>
  );
}
