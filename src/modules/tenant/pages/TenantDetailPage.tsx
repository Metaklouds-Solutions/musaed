/**
 * Tenant detail page with 7 tabs. Shared by admin and tenant context.
 */

import { useState } from 'react';
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

export function TenantDetailPage() {
  const { tenant, isLoading } = useTenantDetail();
  const [activeTab, setActiveTab] = useState<TenantTab>('overview');
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin/');
  const backTo = isAdmin ? '/admin/tenants' : '/tenants/me';

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
        className="inline-flex flex-wrap w-full sm:w-auto gap-1.5 p-2 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm ring-1 ring-black/5"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
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
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantOverviewTab tenant={tenant} />
          </motion.div>
        )}
        {activeTab === 'agents' && (
          <motion.div key="agents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantAgentsTab agents={tenant.agents} />
          </motion.div>
        )}
        {activeTab === 'members' && (
          <motion.div key="members" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantMembersTab members={tenant.members} />
          </motion.div>
        )}
        {activeTab === 'calls' && (
          <motion.div key="calls" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantCallsTab />
          </motion.div>
        )}
        {activeTab === 'billing' && (
          <motion.div key="billing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantBillingTab billing={tenant.billing} />
          </motion.div>
        )}
        {activeTab === 'support' && (
          <motion.div key="support" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantSupportTab tickets={tenant.tickets} />
          </motion.div>
        )}
        {activeTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantSettingsTab settings={tenant.settings} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
