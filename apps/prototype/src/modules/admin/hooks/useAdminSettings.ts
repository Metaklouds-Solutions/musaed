import { useCallback, useEffect, useRef, useState } from 'react';
import { settingsAdapter, reportsAdapter } from '../../../adapters';
import type { AdminSettings } from '../../../adapters/local/settings.adapter';
import type { ScheduledReportConfig } from '../../../adapters/local/reports.adapter';

/** Admin settings hook for loading and saving settings and report schedule config. */
export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(() =>
    settingsAdapter.getAdminSettings()
  );
  const [scheduledConfig, setScheduledConfig] = useState<ScheduledReportConfig>(() =>
    reportsAdapter.getScheduledReportConfig()
  );
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current !== null) {
        window.clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const save = useCallback(() => {
    settingsAdapter.saveAdminSettings(settings);
    reportsAdapter.setScheduledReportConfig(scheduledConfig);
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
