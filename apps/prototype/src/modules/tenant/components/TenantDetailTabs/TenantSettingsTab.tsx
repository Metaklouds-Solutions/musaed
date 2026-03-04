/**
 * Tenant detail Settings tab: business hours, notifications, integrations.
 */

import { motion } from 'motion/react';
import { Settings } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../../../shared/ui';
import type { TenantSettingsSummary } from '../../../../shared/types';

interface TenantSettingsTabProps {
  settings: TenantSettingsSummary;
}

export function TenantSettingsTab({ settings }: TenantSettingsTabProps) {
  const flags = Object.entries(settings.featureFlags ?? {}).filter(([, v]) => v);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card variant="glass">
        <CardHeader className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Settings className="w-5 h-5" aria-hidden />
          Settings
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Business hours</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{settings.businessHours}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">After-hours behavior</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{settings.afterHoursBehavior}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Notifications</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{settings.notifications}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">PMS integration</dt>
              <dd className="font-medium text-[var(--text-primary)] mt-1">{settings.pmsIntegration}</dd>
            </div>
            {flags.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-[var(--text-muted)]">Feature flags</dt>
                <dd className="font-medium text-[var(--text-primary)] mt-1">
                  {flags.map(([k]) => k).join(', ')}
                </dd>
              </div>
            )}
          </dl>
        </CardBody>
      </Card>
    </motion.div>
  );
}
