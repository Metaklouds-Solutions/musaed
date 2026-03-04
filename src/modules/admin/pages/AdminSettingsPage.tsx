/**
 * Admin settings page. Tab switcher: Admin Users | Integrations | Retention | Webhooks | Reports | Audit.
 * Single Settings item in sidebar; switch sections via tabs (like Tenants page).
 */

import { useState, useCallback, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader, Button } from '../../../shared/ui';
import {
  AdminUsersSection,
  IntegrationsSection,
  WebhookEventLogSection,
  RetentionSection,
  AuditLogSection,
  ScheduledReportsSection,
} from '../components/settings';
import { useAdminSettings } from '../hooks';
import { CheckCircle2, Save, Users, Plug, FileText, Webhook, BarChart3, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'admin-users' | 'integrations' | 'retention' | 'webhooks' | 'reports' | 'audit';

const TABS: { id: SettingsTab; label: string; icon: typeof Users }[] = [
  { id: 'admin-users', label: 'Admin Users', icon: Users },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'retention', label: 'Retention', icon: FileText },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'audit', label: 'Audit', icon: ClipboardList },
];

function getTabId(tab: SettingsTab): string {
  return `admin-settings-tab-${tab}`;
}

function getPanelId(tab: SettingsTab): string {
  return `admin-settings-panel-${tab}`;
}

/** Renders admin settings tabs for users, integrations, retention, and reports. */
export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('admin-users');
  const {
    settings,
    scheduledConfig,
    setScheduledConfig,
    saved,
    save,
    updateRetentionToggle,
    updateRetentionDays,
  } = useAdminSettings();

  const showSaveButton = activeTab === 'admin-users' || activeTab === 'integrations' || activeTab === 'retention' || activeTab === 'reports';
  const activeIndex = TABS.findIndex((tab) => tab.id === activeTab);

  const handleTabsKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = activeIndex;
      if (event.key === 'ArrowRight') nextIndex = (activeIndex + 1) % TABS.length;
      if (event.key === 'ArrowLeft') nextIndex = (activeIndex - 1 + TABS.length) % TABS.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = TABS.length - 1;
      setActiveTab(TABS[nextIndex].id);
    },
    [activeIndex]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <PageHeader
              title="Settings"
              description="Admin users, integrations, retention, webhooks, reports. Switch tabs to manage each area."
            />
          </div>
          {showSaveButton && (
            <Button
              onClick={save}
              className="shrink-0 flex items-center gap-2"
              aria-label={saved ? 'Saved' : 'Save changes'}
            >
              {saved ? <CheckCircle2 size={18} aria-hidden /> : <Save size={18} aria-hidden />}
              {saved ? 'Saved' : 'Save Changes'}
            </Button>
          )}
        </div>

        {/* Tab switcher - unified with Tenant Settings */}
        <div
          role="tablist"
          aria-label="Settings section"
          onKeyDown={handleTabsKeyDown}
          className="inline-flex flex-wrap w-full sm:w-auto gap-1.5 p-2 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm ring-1 ring-black/5"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={getTabId(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={getPanelId(tab.id)}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'admin-users' && (
          <motion.div
            key="admin-users"
            id={getPanelId('admin-users')}
            role="tabpanel"
            aria-labelledby={getTabId('admin-users')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 max-w-3xl"
          >
            <AdminUsersSection users={settings.adminUsers} />
          </motion.div>
        )}
        {activeTab === 'integrations' && (
          <motion.div
            key="integrations"
            id={getPanelId('integrations')}
            role="tabpanel"
            aria-labelledby={getTabId('integrations')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 max-w-3xl"
          >
            <IntegrationsSection integrations={settings.integrations} />
          </motion.div>
        )}
        {activeTab === 'retention' && (
          <motion.div
            key="retention"
            id={getPanelId('retention')}
            role="tabpanel"
            aria-labelledby={getTabId('retention')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 max-w-3xl"
          >
            <RetentionSection
              policies={settings.retentionPolicies}
              onToggle={updateRetentionToggle}
              onDaysChange={updateRetentionDays}
            />
          </motion.div>
        )}
        {activeTab === 'webhooks' && (
          <motion.div
            key="webhooks"
            id={getPanelId('webhooks')}
            role="tabpanel"
            aria-labelledby={getTabId('webhooks')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 max-w-3xl"
          >
            <WebhookEventLogSection />
          </motion.div>
        )}
        {activeTab === 'reports' && (
          <motion.div
            key="reports"
            id={getPanelId('reports')}
            role="tabpanel"
            aria-labelledby={getTabId('reports')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 max-w-3xl"
          >
            <ScheduledReportsSection config={scheduledConfig} onChange={setScheduledConfig} />
          </motion.div>
        )}
        {activeTab === 'audit' && (
          <motion.div
            key="audit"
            id={getPanelId('audit')}
            role="tabpanel"
            aria-labelledby={getTabId('audit')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 max-w-3xl"
          >
            <AuditLogSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
