/**
 * Bookings table. Data from props only; no adapter access.
 * Responsive with DataTable, PillTag for status.
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
import type { Booking } from '../../../../shared/types';

interface BookingsTableProps {
  bookings: Booking[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  if (bookings.length === 0) return null;
  return (
    <DataTable minWidth="min-w-[640px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Linked call</TableHead>
            <TableHead aria-hidden />
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="text-[var(--text-secondary)] text-sm">
                {formatDate(b.createdAt)}
              </TableCell>
              <TableCell className="font-medium text-[var(--text-primary)]">
                {b.id}
              </TableCell>
              <TableCell>
                <PillTag variant="status">{b.status}</PillTag>
              </TableCell>
              <TableCell>
                {b.callId ? (
                  <ViewButton to={`/calls/${b.callId}`} aria-label="View call">
                    View call
                  </ViewButton>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                )}
              </TableCell>
              <TableCell />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}
