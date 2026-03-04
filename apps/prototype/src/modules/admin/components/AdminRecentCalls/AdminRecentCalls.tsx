/**
 * Admin dashboard: recent calls table (cross-tenant).
 */

import { motion } from 'motion/react';
import { DataTable, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, ViewButton, PillTag } from '../../../../shared/ui';
import type { AdminRecentCall } from '../../../../shared/types';

interface AdminRecentCallsProps {
  calls: AdminRecentCall[];
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDateTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function OutcomePill({ outcome }: { outcome: AdminRecentCall['outcome'] }) {
  const variant =
    outcome === 'booked'
      ? 'outcomeBooked'
      : outcome === 'escalated'
        ? 'outcomeEscalated'
        : outcome === 'failed'
          ? 'outcomeFailed'
          : 'outcomePending';
  return <PillTag variant={variant}>{outcome}</PillTag>;
}

/** Renders cross-tenant recent calls with outcome and duration. */
export function AdminRecentCalls({ calls }: AdminRecentCallsProps) {
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
      transition={{ duration: 0.3, delay: 0.15 }}
      className="rounded-[var(--radius-card)] card-glass overflow-x-auto"
    >
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Calls</h2>
        <ViewButton to="/admin/calls">View all</ViewButton>
      </div>
      <DataTable minWidth="min-w-[480px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium text-[var(--text-primary)]">{c.tenantName}</TableCell>
              <TableCell className="text-[var(--text-secondary)]">{c.agentName}</TableCell>
              <TableCell><OutcomePill outcome={c.outcome} /></TableCell>
              <TableCell className="text-[var(--text-muted)]">{formatDuration(c.duration)}</TableCell>
              <TableCell className="text-[var(--text-muted)]">{formatDateTime(c.startedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </DataTable>
    </motion.section>
  );
}
