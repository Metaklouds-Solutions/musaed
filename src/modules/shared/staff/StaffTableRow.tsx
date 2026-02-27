/**
 * Single staff table row. Avatar, PillTag for role, StatusDot for status.
 */

import { TableRow, TableCell, Avatar, PillTag, StatusDot } from '../../../shared/ui';
import type { StaffRow } from '../../../shared/types';

interface StaffTableRowProps {
  staff: StaffRow;
  showTenant?: boolean;
}

export function StaffTableRow({ staff, showTenant = false }: StaffTableRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={staff.name} size="md" />
          <div className="min-w-0">
            <p className="font-medium text-[var(--text-primary)] truncate">{staff.name}</p>
            <p className="text-sm text-[var(--text-muted)] truncate">{staff.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <PillTag variant="role">{staff.roleLabel}</PillTag>
      </TableCell>
      {showTenant && (
        <TableCell className="text-[var(--text-muted)] text-sm">
          {staff.tenantName ?? staff.tenantId}
        </TableCell>
      )}
      <TableCell>
        <StatusDot
          variant={staff.status === 'active' ? 'active' : 'offline'}
          label={staff.status}
        />
      </TableCell>
    </TableRow>
  );
}
