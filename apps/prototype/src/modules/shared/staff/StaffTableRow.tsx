/**
 * Single staff table row. Avatar, PillTag for role, StatusDot for status.
 */

import { Trash2 } from 'lucide-react';
import { TableRow, TableCell, Avatar, PillTag, StatusDot, Button } from '../../../shared/ui';
import type { StaffRow } from '../../../shared/types';

interface StaffTableRowProps {
  staff: StaffRow;
  showTenant?: boolean;
  showArchiveAction?: boolean;
  onArchive?: (staff: StaffRow) => void;
}

/** Cells only (for use with VirtualizedDataTable). */
export function StaffTableRowCells({ staff, showTenant = false, showArchiveAction, onArchive }: StaffTableRowProps) {
  return (
    <>
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
      {showArchiveAction && onArchive && (
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onArchive(staff)}
            aria-label="Delete staff"
            className="text-[var(--text-muted)] hover:text-[var(--destructive)]"
          >
            <Trash2 size={16} aria-hidden />
          </Button>
        </TableCell>
      )}
    </>
  );
}

export function StaffTableRow(props: StaffTableRowProps) {
  return (
    <TableRow>
      <StaffTableRowCells {...props} />
    </TableRow>
  );
}
