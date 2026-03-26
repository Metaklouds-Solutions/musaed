/**
 * Calls table. Data from props only; no adapter access.
 * Virtualized when 50+ rows. [PHASE-7-VIRTUALIZED-LISTS]
 */

import { Mic } from 'lucide-react';
import {
  VirtualizedDataTable,
  TableHead,
  TableCell,
  ViewButton,
  PillTag,
} from '../../../../shared/ui';
import { SentimentBadge } from '../SentimentBadge';
import type { Call } from '../../../../shared/types';

interface CallsTableProps {
  calls: Call[];
  getCustomerName: (customerId: string) => string;
  /** Base path for view link (e.g. '/admin/calls' for admin). Default: '/calls' */
  viewBasePath?: string;
  /** When provided, show Tenant column (admin cross-tenant view) */
  getTenantName?: (tenantId: string) => string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCost(cost: number | null | undefined): string {
  if (cost == null || Number.isNaN(cost)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(cost);
}

function formatLatency(ms: number | null | undefined): string {
  if (ms == null || Number.isNaN(ms)) return '—';
  return `${Math.round(ms)}ms`;
}

/** Renders the calls grid with optional tenant column and virtualized rows. */
export function CallsTable({
  calls,
  getCustomerName,
  viewBasePath = '/calls',
  getTenantName,
}: CallsTableProps) {
  if (calls.length === 0) return null;
  const showTenant = Boolean(getTenantName);
  return (
    <VirtualizedDataTable
      items={calls}
      getItemKey={(c) => c.id}
      minWidth="min-w-[720px]"
      rowsTinted
      header={
        <>
          {showTenant && <TableHead>Tenant</TableHead>}
          <TableHead>Time</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Cost</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Latency</TableHead>
          <TableHead>Tokens</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Sentiment</TableHead>
          <TableHead>Booking</TableHead>
          <TableHead aria-hidden />
        </>
      }
      renderRow={(call) => (
        <>
          {showTenant && getTenantName && (
            <TableCell className="text-[var(--text-secondary)] text-sm">
              {getTenantName(call.tenantId)}
            </TableCell>
          )}
          <TableCell className="text-[var(--text-secondary)] text-sm">
            <span className="inline-flex items-center gap-1.5">
              {formatDate(call.createdAt)}
              {call.recordingUrl && (
                <Mic
                  size={14}
                  className="text-[var(--text-tertiary)] shrink-0"
                  aria-label="Has recording"
                />
              )}
            </span>
          </TableCell>
          <TableCell>{formatDuration(call.duration)}</TableCell>
          <TableCell className="text-[var(--text-secondary)] text-sm">
            {formatCost(call.callCost)}
          </TableCell>
          <TableCell className="text-[var(--text-secondary)] text-sm capitalize">
            {call.status ?? '—'}
          </TableCell>
          <TableCell className="text-[var(--text-secondary)] text-sm">
            {formatLatency(call.latencyE2e)}
          </TableCell>
          <TableCell className="text-[var(--text-secondary)] text-sm">
            {call.llmTokensTotal != null ? Math.round(call.llmTokensTotal).toLocaleString() : '—'}
          </TableCell>
          <TableCell>{getCustomerName(call.customerId)}</TableCell>
          <TableCell>
            <SentimentBadge score={call.sentimentScore} />
          </TableCell>
          <TableCell>
            {call.bookingCreated ? (
              <PillTag variant="status">Booked</PillTag>
            ) : (
              <span className="text-[var(--text-muted)]">—</span>
            )}
          </TableCell>
          <TableCell>
            <ViewButton to={`${viewBasePath}/${call.id}`} aria-label="View call" />
          </TableCell>
        </>
      )}
    />
  );
}
