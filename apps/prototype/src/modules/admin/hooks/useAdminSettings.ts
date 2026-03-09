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
    const load = settingsAdapter.getAdminSettings();
    if (load instanceof Promise) {
      load.then((s) => setSettings(s)).catch(() => {});
    } else {
      setSettings(load);
    }
  }, []);

  useEffect(() => {
    const load = reportsAdapter.getScheduledReportConfig();
    if (load instanceof Promise) {
      load.then((c) => setScheduledConfig(c)).catch(() => {});
    } else {
      setScheduledConfig(load);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current !== null) {
        window.clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const save = useCallback(async () => {
    const saveSettings = settingsAdapter.saveAdminSettings(settings);
    if (saveSettings instanceof Promise) await saveSettings;
    const setReports = reportsAdapter.setScheduledReportConfig(scheduledConfig);
    if (setReports instanceof Promise) await setReports;
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
