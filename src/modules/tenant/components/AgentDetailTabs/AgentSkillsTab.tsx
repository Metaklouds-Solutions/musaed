import { motion } from 'motion/react';
import { Zap } from 'lucide-react';
import { Card, CardHeader, CardBody, DataTable, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, PillTag } from '../../../../shared/ui';
import type { AgentSkillRow } from '../../../../shared/types';

interface AgentSkillsTabProps {
  skills: AgentSkillRow[];
}

/** Renders enabled/disabled skills with priority order. */
export function AgentSkillsTab({ skills }: AgentSkillsTabProps) {
  const enabled = skills.filter((s) => s.enabled).sort((a, b) => a.priority - b.priority);
  const disabled = skills.filter((s) => !s.enabled);

  if (skills.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[var(--radius-card)] card-glass p-8 text-center">
        <p className="text-[var(--text-muted)] text-sm">No skills configured.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card variant="glass">
        <CardHeader className="text-base font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Skills
        </CardHeader>
        <CardBody className="p-0">
          <DataTable minWidth="min-w-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...enabled, ...disabled].map((s) => (
                  <TableRow key={s.id} className="border-t border-[var(--border-subtle)]/50 first:border-t-0">
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <PillTag variant={s.enabled ? 'status' : 'outcomePending'}>{s.enabled ? 'Enabled' : 'Disabled'}</PillTag>
                    </TableCell>
                    <TableCell className="text-right">{s.priority || '—'}</TableCell>
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
