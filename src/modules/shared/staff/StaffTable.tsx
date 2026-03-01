/**
 * Shared staff table. Virtualized when 50+ rows. [PHASE-7-VIRTUALIZED-LISTS]
 */

import { VirtualizedDataTable, TableHead } from '../../../shared/ui';
import { StaffTableRowCells } from './StaffTableRow';
import type { StaffRow } from '../../../shared/types';

interface StaffTableProps {
  staff: StaffRow[];
  showTenant?: boolean;
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
    <VirtualizedDataTable
      items={staff}
      getItemKey={(s) => `${s.userId}::${s.tenantId}`}
      minWidth="min-w-[640px]"
      header={
        <>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          {showTenant && <TableHead>Tenant</TableHead>}
          <TableHead>Status</TableHead>
          {showArchiveAction && <TableHead className="w-[80px]">Actions</TableHead>}
        </>
      }
      renderRow={(s) => (
        <StaffTableRowCells
          staff={s}
          showTenant={showTenant}
          showArchiveAction={showArchiveAction}
          onArchive={onArchive}
        />
      )}
    />
  );
}
