/**
 * Customers table. Data from props only; no adapter access.
 * Responsive with DataTable, Avatar.
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
  Avatar,
} from '../../../../shared/ui';
import type { Customer } from '../../../../shared/types';

interface CustomersTableProps {
  customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  if (customers.length === 0) return null;
  return (
    <DataTable minWidth="min-w-[640px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="w-[80px] min-w-[80px]" aria-hidden />
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={c.name} size="md" />
                  <span className="font-medium text-[var(--text-primary)] truncate">
                    {c.name}
                  </span>
                </div>
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
    </DataTable>
  );
}
