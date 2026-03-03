/**
 * Agent detail Runs tab: recent runs table.
 */

import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { Card, CardHeader, CardBody, DataTable, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, PillTag } from '../../../../shared/ui';
import type { AgentRunRow } from '../../../../shared/types';

interface AgentRunsTabProps {
  recentRuns: AgentRunRow[];
}

export function AgentRunsTab({ recentRuns }: AgentRunsTabProps) {
  if (recentRuns.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[var(--radius-card)] card-glass p-8 text-center">
        <p className="text-[var(--text-muted)] text-sm">No recent runs.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card variant="glass">
        <CardHeader className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Play className="w-5 h-5" aria-hidden />
          Recent runs
        </CardHeader>
        <CardBody className="p-0">
          <DataTable minWidth="min-w-[560px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run ID</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRuns.map((r) => (
                  <TableRow key={r.runId} className="border-t border-[var(--border-subtle)]/50 first:border-t-0">
                    <TableCell className="font-mono text-sm text-[var(--text-secondary)]">{r.runId}</TableCell>
                    <TableCell className="text-[var(--text-secondary)] text-sm">{r.started}</TableCell>
                    <TableCell className="text-[var(--text-secondary)]">{r.duration}</TableCell>
                    <TableCell className="text-right text-[var(--text-secondary)]">{r.tokensUsed}</TableCell>
                    <TableCell>
                      <PillTag variant={r.status === 'Success' ? 'outcomeBooked' : r.status === 'Escalated' ? 'outcomeEscalated' : 'outcomePending'}>
                        {r.status}
                      </PillTag>
                    </TableCell>
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
