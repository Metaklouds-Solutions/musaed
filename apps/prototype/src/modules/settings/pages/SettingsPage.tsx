/**
 * Tenant settings page. Tab switcher: Profile | Availability | Notifications | Integrations | Agent | Support.
 * Relevant sections grouped into tabs (like Admin Settings).
 */

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader, Button } from '../../../shared/ui';
import {
  AppointmentRemindersSection,
  ClinicProfileSection,
  NotificationsSection,
  ProviderAvailabilitySection,
  CustomPromptsSection,
  SupportSection,
} from '../components';
import { settingsAdapter } from '../../../adapters';
import type { TenantSettings } from '../../../adapters/local/settings.adapter';
import { useSession } from '../../../app/session/SessionContext';
import {
  CheckCircle2,
  Save,
  Building2,
  CalendarRange,
  Bell,
  Plug,
  Bot,
  Construction,
  Headphones,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'availability' | 'notifications' | 'integrations' | 'agent' | 'support';

const TABS: { id: SettingsTab; label: string; icon: typeof Building2 }[] = [
  { id: 'profile', label: 'Profile', icon: Building2 },
  { id: 'availability', label: 'Availability', icon: CalendarRange },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'agent', label: 'Agent', icon: Bot },
  { id: 'support', label: 'Support', icon: Headphones },
];

const VALID_TABS = new Set<string>(TABS.map((t) => t.id));

/** Type-guard to validate a URL search param as a valid tab ID. */
function isSettingsTab(value: string | null): value is SettingsTab {
  return value !== null && VALID_TABS.has(value);
}

export function SettingsPage() {
  const { user } = useSession();
  const tenantId = user?.tenantId;
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    isSettingsTab(tabParam) ? tabParam : 'profile',
  );

  const handleTabChange = useCallback(
    (tab: SettingsTab) => {
      setActiveTab(tab);
      setSearchParams(tab === 'profile' ? {} : { tab }, { replace: true });
    },
    [setSearchParams],
  );
  const defaultSettings: TenantSettings = {
    timezone: 'Asia/Riyadh',
    locale: 'ar',
    businessHours: 'Mon–Fri 9am–5pm',
    notifications: { emailDigest: true, ticketAlerts: true, bookingReminders: true },
    appointmentReminders: { advanceMinutes: 60, channel: 'email' },
  };
  const [settings, setSettings] = useState<TenantSettings>(() => {
    const result = settingsAdapter.getTenantSettings(tenantId);
    return result instanceof Promise ? defaultSettings : result;
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = settingsAdapter.getTenantSettings(tenantId);
    if (load instanceof Promise) {
      load.then((s) => setSettings(s)).catch(() => {});
    } else if (tenantId) {
      setSettings(load);
    }
  }, [tenantId]);

  const handleSave = useCallback(async () => {
    const result = settingsAdapter.saveTenantSettings(settings, tenantId);
    if (result instanceof Promise) await result;
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings, tenantId]);

  const showSaveButton =
    activeTab === 'profile' || activeTab === 'notifications' || activeTab === 'agent';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <PageHeader
              title="Clinic Settings"
              description="Configure your clinic profile, availability, and preferences. Switch tabs to manage each area."
            />
          </div>
          {showSaveButton && (
            <Button
              onClick={handleSave}
              className="shrink-0 flex items-center gap-2"
              aria-label={saved ? 'Saved' : 'Save changes'}
            >
              {saved ? <CheckCircle2 size={18} aria-hidden /> : <Save size={18} aria-hidden />}
              {saved ? 'Saved' : 'Save Changes'}
            </Button>
          )}
        </div>

        {/* Tab switcher - polished pill design like Admin Settings */}
        <div
          role="tablist"
          aria-label="Settings section"
          className="inline-flex flex-wrap w-full sm:w-auto gap-1.5 p-2 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm ring-1 ring-black/5"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-[var(--bg-base)] text-[var(--ds-primary)] shadow-md border border-[var(--border-subtle)] ring-1 ring-[var(--ds-primary)]/20'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]/60'
              )}
            >
              <tab.icon size={16} aria-hidden className="shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 max-w-3xl"
          >
            <ClinicProfileSection settings={settings} onChange={setSettings} />
          </motion.div>
        )}
        {activeTab === 'availability' && (
          <motion.div
            key="availability"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 w-full"
          >
            <ProviderAvailabilitySection tenantId={tenantId} />
          </motion.div>
        )}
        {activeTab === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 max-w-3xl"
          >
            <NotificationsSection
              notifications={settings.notifications}
              onChange={(notifications) => setSettings((s) => ({ ...s, notifications }))}
            />
            <AppointmentRemindersSection
              config={settings.appointmentReminders ?? { advanceMinutes: 60, channel: 'email' }}
              onChange={(appointmentReminders) => setSettings((s) => ({ ...s, appointmentReminders }))}
              disabled={!settings.notifications.bookingReminders}
            />
          </motion.div>
        )}
        {activeTab === 'integrations' && (
          <motion.div
            key="integrations"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 max-w-3xl"
          >
            <div
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-2xl border p-12 text-center',
                'border-[var(--border)] bg-[var(--bg-surface)]'
              )}
            >
              <Construction size={40} className="text-[var(--text-secondary)]" aria-hidden />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Coming Soon</h3>
              <p className="max-w-sm text-sm text-[var(--text-secondary)]">
                PMS integration is under development. Stay tuned for updates.
              </p>
            </div>
          </motion.div>
        )}
        {activeTab === 'agent' && (
          <motion.div
            key="agent"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 max-w-3xl"
          >
            <CustomPromptsSection tenantId={tenantId} settings={settings} onChange={setSettings} />
          </motion.div>
        )}
        {activeTab === 'support' && (
          <motion.div
            key="support"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            <SupportSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
