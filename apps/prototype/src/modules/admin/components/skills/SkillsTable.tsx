/**
 * Skills table. Name, Category, Tools Count, Scope, Sync Status, Active, Actions.
 */

import { DataTable, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, PillTag, Badge, Button } from '../../../../shared/ui';
import { Eye, Pencil } from 'lucide-react';
import type { SkillDefinition } from '../../../../shared/types';

interface SkillsTableProps {
  skills: SkillDefinition[];
  toolsCountBySkillId: Record<string, number>;
  onView: (skill: SkillDefinition) => void;
  onEdit: (skill: SkillDefinition) => void;
}

const SYNC_STATUS_BADGE: Record<SkillDefinition['retellSyncStatus'], 'active' | 'pending' | 'inactive'> = {
  draft: 'pending',
  synced: 'active',
  out_of_sync: 'inactive',
};

export function SkillsTable({ skills, toolsCountBySkillId, onView, onEdit }: SkillsTableProps) {
  if (skills.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-8 text-center">
        No skills found.
      </p>
    );
  }

  return (
    <DataTable minWidth="min-w-[640px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Tools</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Sync Status</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {skills.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium text-[var(--text-primary)]">
                {s.displayName}
              </TableCell>
              <TableCell>
                <PillTag variant="role">{s.category}</PillTag>
              </TableCell>
              <TableCell className="text-[var(--text-muted)]">
                {toolsCountBySkillId[s.id] ?? 0}
              </TableCell>
              <TableCell>
                <PillTag variant="plan">{s.scope}</PillTag>
              </TableCell>
              <TableCell>
                <Badge status={SYNC_STATUS_BADGE[s.retellSyncStatus]}>{s.retellSyncStatus}</Badge>
              </TableCell>
              <TableCell>
                <PillTag variant={s.isActive ? 'status' : 'outcomePending'}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </PillTag>
              </TableCell>
              <TableCell className="flex gap-1">
                <Button variant="ghost" onClick={() => onView(s)} className="h-8 px-2 min-h-0" aria-label="View">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" onClick={() => onEdit(s)} className="h-8 px-2 min-h-0" aria-label="Edit">
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
