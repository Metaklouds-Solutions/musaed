/**
 * Tenant dashboard: recent calls table (last 10).
 */

import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { DataTable, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, ViewButton, PillTag } from '../../../../shared/ui';
import type { TenantRecentCall } from '../../../../shared/types';

interface RecentCallsTableProps {
  calls: TenantRecentCall[];
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function OutcomePill({ outcome }: { outcome: TenantRecentCall['outcome'] }) {
  const variant =
    outcome === 'booked'
      ? 'outcomeBooked'
      : outcome === 'escalated'
        ? 'outcomeEscalated'
        : 'outcomeFailed';
  return <PillTag variant={variant}>{outcome}</PillTag>;
}

export function RecentCallsTable({ calls }: RecentCallsTableProps) {
  if (calls.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-[var(--radius-card)] card-glass p-6"
      >
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Calls</h2>
        <p className="text-sm text-[var(--text-muted)]">No calls yet.</p>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-[var(--radius-card)] card-glass overflow-x-auto"
    >
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Calls</h2>
        <ViewButton to="/calls">View all</ViewButton>
      </div>
      <DataTable minWidth="min-w-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Outcome</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link to={`/calls/${c.id}`} className="font-medium text-[var(--ds-primary)] hover:underline">
                  <OutcomePill outcome={c.outcome} />
                </Link>
              </TableCell>
              <TableCell className="text-[var(--text-muted)]">{formatDuration(c.duration)}</TableCell>
              <TableCell className="text-[var(--text-muted)]">{formatDateTime(c.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </DataTable>
    </motion.section>
  );
}
