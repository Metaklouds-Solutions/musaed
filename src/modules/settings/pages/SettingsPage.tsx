/**
 * Tenant settings page. Clinic profile, business hours, notifications.
 */

import { useState, useCallback } from 'react';
import { PageHeader, Button } from '../../../shared/ui';
import {
  ClinicProfileSection,
  BusinessHoursSection,
  NotificationsSection,
} from '../components';
import { settingsAdapter } from '../../../adapters/local/settings.adapter';
import type { TenantSettings } from '../../../adapters/local/settings.adapter';
import { useSession } from '../../../app/session/SessionContext';
import { CheckCircle2, Save } from 'lucide-react';

export function SettingsPage() {
  const { user } = useSession();
  const tenantId = user?.tenantId;
  const [settings, setSettings] = useState<TenantSettings>(() =>
    settingsAdapter.getTenantSettings(tenantId)
  );
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    settingsAdapter.saveTenantSettings(settings, tenantId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings, tenantId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Clinic Settings"
          description="Configure timezone, business hours, and notifications."
        />
        <Button
          onClick={handleSave}
          className="shrink-0 flex items-center gap-2"
          aria-label={saved ? 'Saved' : 'Save changes'}
        >
          {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
          {saved ? 'Saved' : 'Save Changes'}
        </Button>
      </div>

      <div className="space-y-8 max-w-3xl">
        <ClinicProfileSection settings={settings} onChange={setSettings} />
        <BusinessHoursSection
          businessHours={settings.businessHours}
          onChange={(businessHours) => setSettings((s) => ({ ...s, businessHours }))}
        />
        <NotificationsSection
          notifications={settings.notifications}
          onChange={(notifications) => setSettings((s) => ({ ...s, notifications }))}
        />
      </div>
    </div>
  );
}
