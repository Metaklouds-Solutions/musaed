/**
 * Tenant detail Billing tab: plan, payment, credits.
 */

import { motion } from 'motion/react';
import { CreditCard } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../../shared/ui';
import type { TenantBillingSummary } from '../../../../shared/types';

interface TenantBillingTabProps {
  billing: TenantBillingSummary;
}

export function TenantBillingTab({ billing }: TenantBillingTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card variant="glass">
        <CardHeader className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <CreditCard className="w-5 h-5" aria-hidden />
          Billing
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Current plan</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{billing.currentPlan}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Next billing date</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{billing.nextBillingDate}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Last payment</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{billing.lastPayment}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Payment method</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{billing.paymentMethod}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Credits balance</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{billing.creditsBalance}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Overage rate</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{billing.overageRate}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>
    </motion.div>
  );
}
