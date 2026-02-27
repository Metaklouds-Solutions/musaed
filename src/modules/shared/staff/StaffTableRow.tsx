/**
 * Single staff table row.
 */

import { TableRow, TableCell } from '../../../shared/ui';
import type { StaffRow } from '../../../shared/types';

interface StaffTableRowProps {
  staff: StaffRow;
  showTenant?: boolean;
}

export function StaffTableRow({ staff, showTenant = false }: StaffTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium text-[var(--text-primary)]">{staff.name}</TableCell>
      <TableCell className="text-[var(--text-secondary)]">{staff.email}</TableCell>
      <TableCell>{staff.roleLabel}</TableCell>
      {showTenant && (
        <TableCell className="text-[var(--text-muted)]">{staff.tenantName ?? staff.tenantId}</TableCell>
      )}
      <TableCell>
        <span className={`text-sm capitalize ${staff.status === 'active' ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
          {staff.status}
        </span>
      </TableCell>
    </TableRow>
  );
}
