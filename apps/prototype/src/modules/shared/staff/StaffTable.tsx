/**
 * Shared staff table. Virtualized when 50+ rows. [PHASE-7-BULK-ACTIONS] selectable mode.
 */

import { useRef, useEffect } from 'react';
import { VirtualizedDataTable, TableHead, TableCell } from '../../../shared/ui';
import { StaffTableRowCells } from './StaffTableRow';
import type { StaffRow } from '../../../shared/types';

const ROW_KEY = (s: StaffRow) => `${s.userId}::${s.tenantId}`;

const checkboxClass =
  'w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--ds-primary)] focus:ring-2 focus:ring-[var(--ds-primary)] cursor-pointer';

interface StaffTableProps {
  staff: StaffRow[];
  showTenant?: boolean;
  showArchiveAction?: boolean;
  onArchive?: (staff: StaffRow) => void;
  /** When true, adds checkbox column for bulk selection. */
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onToggle?: (key: string) => void;
  onToggleAll?: () => void;
}

export function StaffTable({
  staff,
  showTenant = false,
  showArchiveAction,
  onArchive,
  selectable,
  selectedKeys,
  onToggle,
  onToggleAll,
}: StaffTableProps) {
  if (staff.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-8 text-center">
        No staff found.
      </p>
    );
  }

  const allSelected = selectable && staff.every((s) => selectedKeys?.has(ROW_KEY(s)));
  const someSelected = selectable && staff.some((s) => selectedKeys?.has(ROW_KEY(s)));
  const headerCheckRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = headerCheckRef.current;
    if (el) el.indeterminate = Boolean(someSelected && !allSelected);
  }, [someSelected, allSelected]);

  return (
    <VirtualizedDataTable
      items={staff}
      getItemKey={ROW_KEY}
      minWidth="min-w-[640px]"
      header={
        <>
          {selectable && (
            <TableHead className="w-12">
              <input
                ref={headerCheckRef}
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                className={checkboxClass}
                aria-label="Select all"
              />
            </TableHead>
          )}
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          {showTenant && <TableHead>Tenant</TableHead>}
          <TableHead>Status</TableHead>
          {showArchiveAction && <TableHead className="w-[80px]">Actions</TableHead>}
        </>
      }
      renderRow={(s) => (
        <>
          {selectable && (
            <TableCell className="w-12">
              <input
                type="checkbox"
                checked={selectedKeys?.has(ROW_KEY(s)) ?? false}
                onChange={() => onToggle?.(ROW_KEY(s))}
                className={checkboxClass}
                aria-label={`Select ${s.name}`}
              />
            </TableCell>
          )}
          <StaffTableRowCells
            staff={s}
            showTenant={showTenant}
            showArchiveAction={showArchiveAction}
            onArchive={onArchive}
          />
        </>
      )}
    />
  );
}
