/**
 * Tenant detail Activity tab: calls and support tickets.
 */

import { motion } from 'motion/react';
import { useLocation, useParams } from 'react-router-dom';
import { Phone, Headphones } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  DataTable,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PillTag,
} from '../../../../shared/ui';
import { CallsTable } from '../../../calls/components/CallsTable';
import { useTenantCallsTabData } from '../../hooks/useTenantCallsTabData';
import type { TenantTicketRow } from '../../../../shared/types';

interface TenantActivityTabProps {
  tickets: TenantTicketRow[];
}

/** Renders tenant activity: calls and support tickets in stacked sections. */
export function TenantActivityTab({ tickets }: TenantActivityTabProps) {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isAdmin = location.pathname.includes('/admin/');
  const viewBasePath = isAdmin && id ? `/admin/tenants/${id}/calls` : '/calls';

  const { calls, getCustomerName } = useTenantCallsTabData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
      >
        <Card variant="glass">
          <CardHeader className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Phone className="w-5 h-5" aria-hidden />
            Calls
          </CardHeader>
          <CardBody className="p-0">
            {calls.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[var(--text-muted)] text-sm">No calls yet.</p>
              </div>
            ) : (
              <CallsTable calls={calls} getCustomerName={getCustomerName} viewBasePath={viewBasePath} />
            )}
          </CardBody>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Card variant="glass">
          <CardHeader className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Headphones className="w-5 h-5" aria-hidden />
            Support Tickets
          </CardHeader>
          <CardBody className="p-0">
            {tickets.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[var(--text-muted)] text-sm">No support tickets.</p>
              </div>
            ) : (
              <DataTable minWidth="min-w-[560px]" variant="plain">
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
                          <PillTag variant={t.priority === 'High' ? 'outcomeEscalated' : 'default'}>
                            {t.priority}
                          </PillTag>
                        </TableCell>
                        <TableCell className="text-[var(--text-secondary)]">{t.status}</TableCell>
                        <TableCell className="text-[var(--text-muted)] text-sm">{t.createdAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DataTable>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </motion.div>
  );
}
