/**
 * Admin settings page. Admin users, Integrations, Retention policies.
 */

import { useState, useCallback } from 'react';
import { PageHeader, Button } from '../../../shared/ui';
import {
  AdminUsersSection,
  IntegrationsSection,
  WebhookEventLogSection,
  RetentionSection,
  AuditLogSection,
  ScheduledReportsSection,
} from '../components/settings';
import { settingsAdapter, reportsAdapter } from '../../../adapters';
import type { AdminSettings } from '../../../adapters/local/settings.adapter';
import type { ScheduledReportConfig } from '../../../adapters/local/reports.adapter';
import { CheckCircle2, Save } from 'lucide-react';

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(() =>
    settingsAdapter.getAdminSettings()
  );
  const [scheduledConfig, setScheduledConfig] = useState<ScheduledReportConfig>(() =>
    reportsAdapter.getScheduledReportConfig()
  );
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    settingsAdapter.saveAdminSettings(settings);
    reportsAdapter.setScheduledReportConfig(scheduledConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings, scheduledConfig]);

  const handleRetentionToggle = useCallback((id: string, enabled: boolean) => {
    setSettings((s) => ({
      ...s,
      retentionPolicies: s.retentionPolicies.map((p) =>
        p.id === id ? { ...p, enabled } : p
      ),
    }));
  }, []);

  const handleRetentionDaysChange = useCallback((id: string, days: number) => {
    setSettings((s) => ({
      ...s,
      retentionPolicies: s.retentionPolicies.map((p) =>
        p.id === id ? { ...p, days: Math.max(1, Math.min(3650, days)) } : p
      ),
    }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Settings"
          description="Admin users, integrations, retention policies."
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
        <AdminUsersSection users={settings.adminUsers} />
        <IntegrationsSection integrations={settings.integrations} />
        <WebhookEventLogSection />
        <RetentionSection
          policies={settings.retentionPolicies}
          onToggle={handleRetentionToggle}
          onDaysChange={handleRetentionDaysChange}
        />
        <ScheduledReportsSection config={scheduledConfig} onChange={setScheduledConfig} />
        <AuditLogSection />
      </div>
    </div>
  );
}
