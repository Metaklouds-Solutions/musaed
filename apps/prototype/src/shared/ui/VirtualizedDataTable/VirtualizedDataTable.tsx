/**
 * Virtualized data table. Renders only visible rows when list exceeds threshold. [PHASE-7-VIRTUALIZED-LISTS]
 */

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableHeader, TableBody, TableRow } from '../Table';
import { DataTable } from '../DataTable';
import { cn } from '@/lib/utils';

const ROW_HEIGHT = 52;
const OVERSCAN = 5;
const MAX_HEIGHT = 400;
const VIRTUALIZE_THRESHOLD = 50;

interface VirtualizedDataTableProps<T> {
  items: readonly T[] | null | undefined;
  header: React.ReactNode;
  renderRow: (item: T) => React.ReactNode;
  getItemKey: (item: T) => string;
  minWidth?: string;
  maxHeight?: number;
}

export function VirtualizedDataTable<T>({
  items,
  header,
  renderRow,
  getItemKey,
  minWidth = 'min-w-[640px]',
  maxHeight = MAX_HEIGHT,
}: VirtualizedDataTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const normalizedItems = Array.isArray(items) ? items : [];
  const useVirtual = normalizedItems.length >= VIRTUALIZE_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: normalizedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  if (normalizedItems.length === 0) return null;

  if (!useVirtual) {
    return (
      <DataTable minWidth={minWidth}>
        <Table>
          <TableHeader>
            <TableRow>{header}</TableRow>
          </TableHeader>
          <TableBody>
            {normalizedItems.map((item) => (
              <TableRow key={getItemKey(item)}>{renderRow(item)}</TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();
  const totalHeight = virtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      className={cn('w-full min-w-0 overflow-auto rounded-(--radius-card) card-glass', minWidth)}
      style={{ maxHeight: `${maxHeight}px` }}
    >
      <div className={minWidth}>
        <Table>
          <TableHeader>
            <TableRow>{header}</TableRow>
          </TableHeader>
          <tbody
            className="relative block divide-y divide-[var(--separator)]"
            style={{ height: `${totalHeight}px` }}
          >
            {virtualItems.map((virtualRow) => {
              const item = normalizedItems[virtualRow.index];
              return (
                <TableRow
                  key={getItemKey(item)}
                  className="absolute left-0 right-0 w-full"
                  style={{
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    height: `${virtualRow.size}px`,
                  }}
                >
                  {renderRow(item)}
                </TableRow>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
