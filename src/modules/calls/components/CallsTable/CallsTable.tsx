/**
 * Calls table. Data from props only; no adapter access.
 * Virtualized when 50+ rows. [PHASE-7-VIRTUALIZED-LISTS]
 */

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
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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
      minWidth="min-w-[640px]"
      header={
        <>
          {showTenant && <TableHead>Tenant</TableHead>}
          <TableHead>Date</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Sentiment</TableHead>
          <TableHead>Booking</TableHead>
          <TableHead aria-hidden />
        </>
      }
      renderRow={(call) => (
        <>
          {showTenant && (
            <TableCell className="text-[var(--text-secondary)] text-sm">
              {getTenantName!(call.tenantId)}
            </TableCell>
          )}
          <TableCell className="text-[var(--text-secondary)] text-sm">
            {formatDate(call.createdAt)}
          </TableCell>
          <TableCell>{getCustomerName(call.customerId)}</TableCell>
          <TableCell>{formatDuration(call.duration)}</TableCell>
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
