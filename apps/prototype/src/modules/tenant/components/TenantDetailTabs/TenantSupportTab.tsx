/**
 * Tenant detail Support tab: tickets list.
 */

import { motion } from 'motion/react';
import { Headphones } from 'lucide-react';
import { Card, CardHeader, CardBody, DataTable, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, PillTag } from '../../../../shared/ui';
import type { TenantTicketRow } from '../../../../shared/types';

interface TenantSupportTabProps {
  tickets: TenantTicketRow[];
}

/** Renders tenant support tickets with priority and lifecycle status. */
export function TenantSupportTab({ tickets }: TenantSupportTabProps) {
  if (tickets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[var(--radius-card)] card-glass p-8 text-center"
      >
        <p className="text-[var(--text-muted)] text-sm">No support tickets.</p>
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
          <Headphones className="w-5 h-5" aria-hidden />
          Support tickets
        </CardHeader>
        <CardBody className="p-0">
          <DataTable minWidth="min-w-[560px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id} className="border-t border-[var(--border-subtle)]/50 first:border-t-0">
                    <TableCell className="font-mono text-sm text-[var(--text-secondary)]">{t.id}</TableCell>
                    <TableCell className="font-medium text-[var(--text-primary)]">{t.title}</TableCell>
                    <TableCell>
                      <PillTag variant={t.priority === 'High' ? 'outcomeEscalated' : 'default'}>{t.priority}</PillTag>
                    </TableCell>
                    <TableCell className="text-[var(--text-secondary)]">{t.status}</TableCell>
                    <TableCell className="text-[var(--text-muted)] text-sm">{t.createdAt}</TableCell>
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
