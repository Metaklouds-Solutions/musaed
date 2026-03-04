/**
 * Tenant detail Calls tab: recent calls table.
 */

import { motion } from 'motion/react';
import { Phone } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../../shared/ui';
import { CallsTable } from '../../../calls/components/CallsTable';
import { useTenantCallsTabData } from '../../hooks/useTenantCallsTabData';

/** Renders tenant calls list for the last 30 days. */
export function TenantCallsTab() {
  const { calls, getCustomerName } = useTenantCallsTabData();

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
