import { useCallback, useEffect, useRef, useState } from 'react';
import { settingsAdapter, reportsAdapter } from '../../../adapters';
import type { AdminSettings } from '../../../adapters/local/settings.adapter';
import type { ScheduledReportConfig } from '../../../adapters/local/reports.adapter';

const defaultAdminSettings: AdminSettings = {
  adminUsers: [],
  integrations: [],
  retentionPolicies: [
    { id: 'rp_1', name: 'Call transcripts', days: 90, enabled: true },
    { id: 'rp_2', name: 'Audit logs', days: 365, enabled: true },
  ],
};

/** Admin settings hook for loading and saving settings and report schedule config. */
export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(defaultAdminSettings);
  const [scheduledConfig, setScheduledConfig] = useState<ScheduledReportConfig>({
    enabled: false,
    frequency: 'weekly',
    recipients: [],
    dayOfWeek: 1,
    dayOfMonth: 1,
  });
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    Promise.resolve(settingsAdapter.getAdminSettings())
      .then((s) => setSettings(s))
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.resolve(reportsAdapter.getScheduledReportConfig())
      .then((c) => setScheduledConfig(c))
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current !== null) {
        window.clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const save = useCallback(async () => {
    await Promise.resolve(settingsAdapter.saveAdminSettings(settings));
    await Promise.resolve(
      reportsAdapter.setScheduledReportConfig(scheduledConfig),
    );
    setSaved(true);
    if (savedTimerRef.current !== null) {
      window.clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = window.setTimeout(() => setSaved(false), 2000);
  }, [settings, scheduledConfig]);

  const updateRetentionToggle = useCallback((id: string, enabled: boolean) => {
    setSettings((s) => ({
      ...s,
      retentionPolicies: s.retentionPolicies.map((p) =>
        p.id === id ? { ...p, enabled } : p
      ),
    }));
  }, []);

  const updateRetentionDays = useCallback((id: string, days: number) => {
    setSettings((s) => ({
      ...s,
      retentionPolicies: s.retentionPolicies.map((p) =>
        p.id === id ? { ...p, days: Math.max(1, Math.min(3650, days)) } : p
      ),
    }));
  }, []);

  return {
    settings,
    setSettings,
    scheduledConfig,
    setScheduledConfig,
    saved,
    save,
    updateRetentionToggle,
    updateRetentionDays,
  };
}
