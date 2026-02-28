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
  /** When true, shows Archive action (admin context). */
  showArchiveAction?: boolean;
  onArchive?: (staff: StaffRow) => void;
}

export function StaffTable({ staff, showTenant = false, showArchiveAction, onArchive }: StaffTableProps) {
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
            {showArchiveAction && <TableHead className="w-[80px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((s) => (
            <StaffTableRow
              key={`${s.userId}::${s.tenantId}`}
              staff={s}
              showTenant={showTenant}
              showArchiveAction={showArchiveAction}
              onArchive={onArchive}
            />
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}
