/**
 * Admin dashboard: recent calls table (cross-tenant).
 */

import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../shared/ui';
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
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function OutcomeBadge({ outcome }: { outcome: AdminRecentCall['outcome'] }) {
  const colors = {
    booked: 'text-[var(--success)]',
    escalated: 'text-[var(--warning)]',
    failed: 'text-[var(--error)]',
    pending: 'text-[var(--text-muted)]',
  };
  return (
    <span className={`font-medium capitalize ${colors[outcome]}`}>
      {outcome}
    </span>
  );
}

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
      className="rounded-[var(--radius-card)] card-glass overflow-hidden"
    >
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Calls</h2>
        <Link
          to="/admin/calls"
          className="text-sm font-medium text-[var(--ds-primary)] hover:underline"
        >
          View all
        </Link>
      </div>
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
              <TableCell><OutcomeBadge outcome={c.outcome} /></TableCell>
              <TableCell className="text-[var(--text-muted)]">{formatDuration(c.duration)}</TableCell>
              <TableCell className="text-[var(--text-muted)]">{formatDateTime(c.startedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.section>
  );
}
