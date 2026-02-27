/**
 * Shared staff table. Admin shows tenant column; tenant view hides it.
 * Responsive with DataTable, Avatar, PillTag, StatusDot.
 */

import {
  DataTable,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../shared/ui';
import { StaffTableRow } from './StaffTableRow';
import type { StaffRow } from '../../../shared/types';

interface StaffTableProps {
  staff: StaffRow[];
  showTenant?: boolean;
}

export function StaffTable({ staff, showTenant = false }: StaffTableProps) {
  if (staff.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-8 text-center">
        No staff found.
      </p>
    );
  }

  return (
    <DataTable minWidth="min-w-[640px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            {showTenant && <TableHead>Tenant</TableHead>}
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((s) => (
            <StaffTableRow key={s.userId} staff={s} showTenant={showTenant} />
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}
