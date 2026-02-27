/**
 * Tenant profile section: name, plan, status, createdAt.
 */

import { Card, CardHeader, CardBody, Badge } from '../../../../shared/ui';
import type { TenantDetail } from '../../../../shared/types';

const statusMap: Record<string, 'active' | 'pending' | 'inactive' | 'error'> = {
  ACTIVE: 'active',
  TRIAL: 'pending',
  SUSPENDED: 'error',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface TenantProfileSectionProps {
  tenant: TenantDetail;
}

export function TenantProfileSection({ tenant }: TenantProfileSectionProps) {
  const badgeStatus = statusMap[tenant.status] ?? 'inactive';
  return (
    <Card variant="glass">
      <CardHeader className="text-base font-semibold text-[var(--text-primary)]">
        Profile
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-[var(--text-primary)]">{tenant.name}</span>
          <Badge status={badgeStatus}>{tenant.status}</Badge>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-[var(--text-muted)]">Plan</dt>
            <dd className="font-medium text-[var(--text-primary)]">{tenant.plan}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Created</dt>
            <dd className="font-medium text-[var(--text-primary)]">{formatDate(tenant.createdAt)}</dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}
