/**
 * Table skeleton placeholder. [PHASE-7-SKELETON-LOADING]
 */

import { Skeleton } from '../Skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../Table';
import { DataTable } from '../DataTable';
import { cn } from '@/lib/utils';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  minWidth?: string;
  className?: string;
}

export function TableSkeleton({
  rows = 8,
  cols = 5,
  minWidth = 'min-w-[640px]',
  className,
}: TableSkeletonProps) {
  return (
    <DataTable minWidth={minWidth} className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: cols }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-16 rounded" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className={cn('h-4 rounded', j === 0 ? 'w-24' : 'w-full max-w-[120px]')} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}
