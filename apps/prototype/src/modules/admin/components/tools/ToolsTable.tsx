/**
 * Tools table. Name, Category, Execution Type, Handler/Endpoint, Active, Actions.
 */

import { DataTable, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, PillTag, Button } from '../../../../shared/ui';
import { Eye, Pencil } from 'lucide-react';
import type { ToolDefinition } from '../../../../shared/types';

interface ToolsTableProps {
  tools: ToolDefinition[];
  onView: (tool: ToolDefinition) => void;
  onEdit: (tool: ToolDefinition) => void;
}

export function ToolsTable({ tools, onView, onEdit }: ToolsTableProps) {
  if (tools.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-8 text-center">
        No tools found.
      </p>
    );
  }

  const getHandlerDisplay = (t: ToolDefinition): string => {
    if (t.executionType === 'internal') return t.handlerKey ?? '—';
    return t.endpointUrl ? `${t.httpMethod ?? 'GET'} ${t.endpointUrl.slice(0, 40)}…` : '—';
  };

  return (
    <DataTable minWidth="min-w-[640px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Execution</TableHead>
            <TableHead>Handler/Endpoint</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tools.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium text-[var(--text-primary)]">
                {t.displayName}
              </TableCell>
              <TableCell>
                <PillTag variant="role">{t.category}</PillTag>
              </TableCell>
              <TableCell>
                <PillTag variant={t.executionType === 'internal' ? 'status' : 'outcome'}>
                  {t.executionType}
                </PillTag>
              </TableCell>
              <TableCell className="font-mono text-sm text-[var(--text-muted)] max-w-[200px] truncate">
                {getHandlerDisplay(t)}
              </TableCell>
              <TableCell>
                <PillTag variant={t.isActive ? 'status' : 'outcomePending'}>
                  {t.isActive ? 'Active' : 'Inactive'}
                </PillTag>
              </TableCell>
              <TableCell className="flex gap-1">
                <Button variant="ghost" onClick={() => onView(t)} className="h-8 px-2 min-h-0" aria-label="View">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" onClick={() => onEdit(t)} className="h-8 px-2 min-h-0" aria-label="Edit">
                  <Pencil className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}
