/**
 * Tenant detail Members tab: staff list.
 */

import { motion } from 'motion/react';
import { Users } from 'lucide-react';
import { Card, CardHeader, CardBody, DataTable, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, PillTag } from '../../../../shared/ui';
import type { TenantMemberRow } from '../../../../shared/types';

interface TenantMembersTabProps {
  members: TenantMemberRow[];
}

export function TenantMembersTab({ members }: TenantMembersTabProps) {
  if (members.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[var(--radius-card)] card-glass p-8 text-center"
      >
        <p className="text-[var(--text-muted)] text-sm">No members yet.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card variant="glass">
        <CardHeader className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Users className="w-5 h-5" aria-hidden />
          Members
        </CardHeader>
        <CardBody className="p-0">
          <DataTable minWidth="min-w-[480px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m, i) => (
                  <TableRow key={i} className="border-t border-[var(--border-subtle)]/50 first:border-t-0">
                    <TableCell className="font-medium text-[var(--text-primary)]">{m.name}</TableCell>
                    <TableCell className="text-[var(--text-secondary)]">{m.role}</TableCell>
                    <TableCell>
                      <PillTag variant={m.status === 'active' ? 'status' : 'outcomePending'}>{m.status}</PillTag>
                    </TableCell>
                    <TableCell className="text-[var(--text-muted)] text-sm">{m.joined}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTable>
        </CardBody>
      </Card>
    </motion.div>
  );
}
