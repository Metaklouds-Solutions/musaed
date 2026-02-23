/**
 * Customers table. Data from props only; no adapter access.
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
import type { Customer } from '../../../../shared/types';

interface CustomersTableProps {
  customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  if (customers.length === 0) return null;
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-card)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead aria-hidden />
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium text-[var(--text-primary)]">
                {c.name}
              </TableCell>
              <TableCell className="text-[var(--text-secondary)] text-sm">
                {c.email ?? '—'}
              </TableCell>
              <TableCell>
                <Link
                  to={`/customers/${c.id}`}
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
