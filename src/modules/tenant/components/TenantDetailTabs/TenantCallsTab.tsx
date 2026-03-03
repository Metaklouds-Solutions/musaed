/**
 * Tenant detail Calls tab: recent calls table.
 */

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Phone } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../../shared/ui';
import { CallsTable } from '../../../calls/components/CallsTable';
import { callsAdapter, customersAdapter } from '../../../../adapters';

const DEFAULT_RANGE = (() => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { start, end };
})();

export function TenantCallsTab() {
  const { id } = useParams<{ id: string }>();
  const calls = useMemo(() => callsAdapter.getCalls(id ?? undefined, DEFAULT_RANGE), [id]);
  const getCustomerName = useMemo(
    () => (customerId: string) => customersAdapter.getCustomerById(customerId, id ?? undefined)?.name ?? customerId,
    [id]
  );

  if (calls.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[var(--radius-card)] card-glass p-8 text-center"
      >
        <p className="text-[var(--text-muted)] text-sm">No calls yet.</p>
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
          <Phone className="w-5 h-5" aria-hidden />
          Recent calls (last 30 days)
        </CardHeader>
        <CardBody className="p-0">
          <CallsTable calls={calls} getCustomerName={getCustomerName} viewBasePath="/calls" />
        </CardBody>
      </Card>
    </motion.div>
  );
}
