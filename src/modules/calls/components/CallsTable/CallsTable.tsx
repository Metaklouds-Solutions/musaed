/**
 * Calls table. Data from props only; no adapter access.
 */

import { Link } from 'react-router-dom';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
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
    <div className="rounded-[var(--radius-card)] card-glass overflow-hidden">
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
                  <span className="text-[var(--success)]">Yes</span>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                )}
              </TableCell>
              <TableCell>
                <Link
                  to={`/calls/${call.id}`}
                  className="text-[var(--primary)] hover:underline text-sm font-medium"
                >
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
