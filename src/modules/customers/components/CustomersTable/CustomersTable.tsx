/**
 * Customers table. Data from props only; no adapter access.
 * PII (name, email) masked by default; auditors can reveal.
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
import { usePiiMask } from '../../../../shared/hooks/usePiiMask';
import type { Customer } from '../../../../shared/types';

interface CustomersTableProps {
  customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const { maskName, maskEmail } = usePiiMask();
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
                  <Avatar name={maskName(c.name)} size="md" />
                  <span className="font-medium text-[var(--text-primary)] truncate">
                    {maskName(c.name)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-[var(--text-secondary)] text-sm">
                {maskEmail(c.email)}
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
