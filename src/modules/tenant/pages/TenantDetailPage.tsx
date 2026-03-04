/**
 * Tenant detail page with 7 tabs. Shared by admin and tenant context.
 */

import { useState, type KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  LayoutDashboard,
  Bot,
  Users,
  Phone,
  CreditCard,
  Headphones,
  Settings,
} from 'lucide-react';
import { PageHeader } from '../../../shared/ui';
import { useTenantDetail } from '../hooks/useTenantDetail';
import {
  TenantOverviewTab,
  TenantAgentsTab,
  TenantMembersTab,
  TenantCallsTab,
  TenantBillingTab,
  TenantSupportTab,
  TenantSettingsTab,
} from '../components/TenantDetailTabs';
import { cn } from '@/lib/utils';

type TenantTab = 'overview' | 'agents' | 'members' | 'calls' | 'billing' | 'support' | 'settings';

const TABS: { id: TenantTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'calls', label: 'Calls', icon: Phone },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'support', label: 'Support', icon: Headphones },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function getTabId(tab: TenantTab): string {
  return `tenant-detail-tab-${tab}`;
}

function getPanelId(tab: TenantTab): string {
  return `tenant-detail-panel-${tab}`;
}

export function TenantDetailPage() {
  const { tenant, isLoading } = useTenantDetail();
  const [activeTab, setActiveTab] = useState<TenantTab>('overview');
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin/');
  const backTo = isAdmin ? '/admin/tenants' : '/tenants/me';
  const activeIndex = TABS.findIndex((tab) => tab.id === activeTab);

  const handleTabsKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = activeIndex;
    if (event.key === 'ArrowRight') nextIndex = (activeIndex + 1) % TABS.length;
    if (event.key === 'ArrowLeft') nextIndex = (activeIndex - 1 + TABS.length) % TABS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = TABS.length - 1;
    setActiveTab(TABS[nextIndex].id);
  };

  if (isLoading || !tenant) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tenant Details" description="Loading…" />
        <div className="rounded-[var(--radius-card)] card-glass p-8 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            {tenant === null && !isLoading ? 'Tenant not found.' : 'Loading tenant…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {isAdmin ? 'Back to tenants' : 'Back'}
        </Link>
        <PageHeader
          title={tenant.profile.clinicName}
          description={`${tenant.id} · ${tenant.profile.plan}`}
        />
      </motion.header>

      <div
        role="tablist"
        aria-label="Tenant sections"
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
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
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

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" id={getPanelId('overview')} role="tabpanel" aria-labelledby={getTabId('overview')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantOverviewTab tenant={tenant} />
          </motion.div>
        )}
        {activeTab === 'agents' && (
          <motion.div key="agents" id={getPanelId('agents')} role="tabpanel" aria-labelledby={getTabId('agents')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantAgentsTab agents={tenant.agents} />
          </motion.div>
        )}
        {activeTab === 'members' && (
          <motion.div key="members" id={getPanelId('members')} role="tabpanel" aria-labelledby={getTabId('members')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantMembersTab members={tenant.members} />
          </motion.div>
        )}
        {activeTab === 'calls' && (
          <motion.div key="calls" id={getPanelId('calls')} role="tabpanel" aria-labelledby={getTabId('calls')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantCallsTab />
          </motion.div>
        )}
        {activeTab === 'billing' && (
          <motion.div key="billing" id={getPanelId('billing')} role="tabpanel" aria-labelledby={getTabId('billing')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantBillingTab billing={tenant.billing} />
          </motion.div>
        )}
        {activeTab === 'support' && (
          <motion.div key="support" id={getPanelId('support')} role="tabpanel" aria-labelledby={getTabId('support')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantSupportTab tickets={tenant.tickets} />
          </motion.div>
        )}
        {activeTab === 'settings' && (
          <motion.div key="settings" id={getPanelId('settings')} role="tabpanel" aria-labelledby={getTabId('settings')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantSettingsTab settings={tenant.settings} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
