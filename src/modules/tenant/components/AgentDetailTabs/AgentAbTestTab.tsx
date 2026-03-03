import { motion } from 'motion/react';
import { GitCompare } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../../shared/ui';
import type { AgentAbTest } from '../../../../shared/types';

interface AgentAbTestTabProps {
  abTest: AgentAbTest;
}

export function AgentAbTestTab({ abTest }: AgentAbTestTabProps) {
  const isActive = abTest.status !== 'Inactive' && abTest.status !== 'Not Configured';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Card variant="glass">
        <CardHeader className="text-base font-semibold flex items-center gap-2">
          <GitCompare className="w-5 h-5" />
          A/B Test
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Status</dt>
              <dd className="font-medium mt-1">{abTest.status}</dd>
            </div>
            {isActive && (
              <>
                <div>
                  <dt className="text-[var(--text-muted)]">Version A</dt>
                  <dd className="font-medium mt-1">{abTest.versionA}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Version B</dt>
                  <dd className="font-medium mt-1">{abTest.versionB}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Split</dt>
                  <dd className="font-medium mt-1">{abTest.splitPercent}% / {100 - abTest.splitPercent}%</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Started</dt>
                  <dd className="font-medium mt-1">{abTest.started}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Leader so far</dt>
                  <dd className="font-medium mt-1">{abTest.winnerSoFar || '—'}</dd>
                </div>
              </>
            )}
          </dl>
        </CardBody>
      </Card>
    </motion.div>
  );
}
