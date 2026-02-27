/**
 * Tenant settings section: timezone, locale, business hours.
 */

import { Card, CardHeader, CardBody } from '../../../../shared/ui';
import type { TenantDetail } from '../../../../shared/types';

interface TenantSettingsSectionProps {
  tenant: TenantDetail;
}

export function TenantSettingsSection({ tenant }: TenantSettingsSectionProps) {
  return (
    <Card variant="glass">
      <CardHeader className="text-base font-semibold text-[var(--text-primary)]">
        Settings
      </CardHeader>
      <CardBody>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-[var(--text-muted)]">Timezone</dt>
            <dd className="font-medium text-[var(--text-primary)] mt-0.5">{tenant.timezone}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Locale</dt>
            <dd className="font-medium text-[var(--text-primary)] mt-0.5">{tenant.locale}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Business hours</dt>
            <dd className="font-medium text-[var(--text-primary)] mt-0.5">{tenant.businessHours}</dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}
