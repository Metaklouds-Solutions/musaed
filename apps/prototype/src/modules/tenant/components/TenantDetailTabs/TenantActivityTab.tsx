/**
 * Tenant detail Activity tab: calls, agent runs, and support tickets.
 */

import { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation, useParams } from 'react-router-dom';
import { Phone, Headphones, Cpu } from 'lucide-react';
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
  Modal,
  ModalHeader,
  TableSkeleton,
} from '../../../../shared/ui';
import { CallsTable } from '../../../calls/components/CallsTable';
import { RunsTable } from '../../../admin/components/RunsTable';
import { RunEventsViewer } from '../../../admin/components/RunEventsViewer';
import { useTenantCallsTabData } from '../../hooks/useTenantCallsTabData';
import { useTenantRunsTabData } from '../../hooks/useTenantRunsTabData';
import { runsAdapter } from '../../../../adapters';
import { useAsyncData } from '../../../../shared/hooks/useAsyncData';
import type { TenantTicketRow } from '../../../../shared/types';
import type { RunEvent } from '../../../../shared/types/entities';
import type { AdminRunRow } from '../../../../adapters/local/runs.adapter';

interface TenantActivityTabProps {
  tickets: TenantTicketRow[];
}

/** Renders tenant activity: calls, agent runs, and support tickets in stacked sections. */
export function TenantActivityTab({ tickets }: TenantActivityTabProps) {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isAdmin = location.pathname.includes('/admin/');
  const viewBasePath = isAdmin && id ? `/admin/tenants/${id}/calls` : '/calls';

  const { calls, callsLoading, getCustomerName } = useTenantCallsTabData();
  const { runs, loading: runsLoading, error: runsError } = useTenantRunsTabData();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const { data: events, error: runEventsError } = useAsyncData(
    () =>
      selectedRunId
        ? runsAdapter.getRunEvents(selectedRunId, id ?? undefined)
        : Promise.resolve([]),
    [selectedRunId, id],
    [] as RunEvent[],
  );

  const handleViewRun = useCallback((run: AdminRunRow) => setSelectedRunId(run.id), []);
  const handleCloseModal = useCallback(() => setSelectedRunId(null), []);

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
            {callsLoading ? (
              <TableSkeleton rows={5} cols={6} minWidth="min-w-[640px]" />
            ) : calls.length > 0 ? (
              <CallsTable calls={calls} getCustomerName={getCustomerName} viewBasePath={viewBasePath} />
            ) : null}
          </CardBody>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.075 }}
      >
        <Card variant="glass">
          <CardHeader className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Cpu className="w-5 h-5" aria-hidden />
            Agent Runs
          </CardHeader>
          <CardBody className="p-0">
            {runsError ? (
              <p className="px-4 py-6 text-sm text-red-600" role="alert">
                {runsError.message}
              </p>
            ) : runsLoading ? (
              <TableSkeleton rows={5} cols={7} minWidth="min-w-[640px]" />
            ) : runs.length > 0 ? (
              <RunsTable runs={runs} onViewRun={handleViewRun} variant="plain" />
            ) : null}
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

      <Modal
        open={selectedRunId !== null}
        onClose={handleCloseModal}
        title={selectedRunId ? `Run ${selectedRunId}` : 'Run events'}
      >
        <ModalHeader
          title={selectedRunId ? `Run ${selectedRunId}` : 'Run events'}
          onClose={handleCloseModal}
        />
        <div className="p-5">
          {runEventsError ? (
            <p className="text-sm text-red-600" role="alert">
              {runEventsError.message}
            </p>
          ) : (
            <RunEventsViewer events={events} />
          )}
        </div>
      </Modal>
    </motion.div>
  );
}
