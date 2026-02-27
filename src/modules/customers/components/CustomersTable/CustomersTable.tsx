/**
 * Customers table. Data from props only; no adapter access.
 */

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ViewButton,
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
                <ViewButton to={`/customers/${c.id}`} aria-label="View customer" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
