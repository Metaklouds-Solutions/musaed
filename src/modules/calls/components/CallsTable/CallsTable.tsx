/**
 * Calls table. Data from props only; no adapter access.
 * Responsive with DataTable, PillTag for booking outcome.
 */

import {
  DataTable,
  Table,
  TableHeader,
  TableBody,
  TableRow,
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

export function CallsTable({ calls, getCustomerName }: CallsTableProps) {
  if (calls.length === 0) return null;
  return (
    <DataTable minWidth="min-w-[640px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Sentiment</TableHead>
            <TableHead>Booking</TableHead>
            <TableHead aria-hidden />
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => (
            <TableRow key={call.id}>
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
                <ViewButton to={`/calls/${call.id}`} aria-label="View call" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}
