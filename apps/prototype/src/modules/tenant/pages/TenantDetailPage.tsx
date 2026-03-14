/**
 * Tenant detail page with 4 tabs. Shared by admin and tenant context.
 */

import { useState, type KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  Activity,
} from 'lucide-react';
import { PageHeader, Skeleton } from '../../../shared/ui';
import { useTenantDetail } from '../hooks/useTenantDetail';
import {
  TenantOverviewTab,
  TenantTeamTab,
  TenantActivityTab,
} from '../components/TenantDetailTabs';
import { cn } from '@/lib/utils';

type TenantTab = 'overview' | 'team' | 'activity';

const TABS: { id: TenantTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'activity', label: 'Activity', icon: Activity },
];

function getTabId(tab: TenantTab): string {
  return `tenant-detail-tab-${tab}`;
}

function getPanelId(tab: TenantTab): string {
  return `tenant-detail-panel-${tab}`;
}

/** Skeleton loader for tenant detail page. */
function TenantDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading tenant details">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg shrink-0" />
      </div>

      <div className="inline-flex flex-wrap gap-1.5 p-2 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-sm">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-20 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      <div className="space-y-4">
        <div className="rounded-[var(--radius-card)] card-glass overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)]/50">
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] card-glass overflow-hidden">
          <div className="p-4 border-b border-[var(--border-subtle)]/50">
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <div className="p-5 space-y-3">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-[80%] rounded" />
            <Skeleton className="h-4 w-[70%] rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Renders tenant/admin tenant detail tabs with keyboard-accessible navigation. */
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

  if (tenant === null && !isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tenant Details" description="Not found" />
        <div className="rounded-[var(--radius-card)] card-glass p-8 text-center">
          <p className="text-[var(--text-muted)] text-sm">Tenant not found.</p>
        </div>
      </div>
    );
  }

  if (isLoading || !tenant) {
    return <TenantDetailSkeleton />;
  }

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <PageHeader
          title={tenant.profile.clinicName}
          description={`${tenant.id} · ${tenant.profile.plan}`}
        />
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-[var(--ds-primary)]/10 text-[var(--ds-primary)] hover:bg-[var(--ds-primary)]/20 transition-colors shrink-0 self-start sm:self-center"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {isAdmin ? 'Back to tenants' : 'Back'}
        </Link>
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
            <TenantOverviewTab tenant={tenant} agents={tenant.agents} />
          </motion.div>
        )}
        {activeTab === 'team' && (
          <motion.div key="team" id={getPanelId('team')} role="tabpanel" aria-labelledby={getTabId('team')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantTeamTab members={tenant.members} />
          </motion.div>
        )}
        {activeTab === 'activity' && (
          <motion.div key="activity" id={getPanelId('activity')} role="tabpanel" aria-labelledby={getTabId('activity')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <TenantActivityTab tickets={tenant.tickets} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
