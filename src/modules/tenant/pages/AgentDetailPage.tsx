/**
 * Agent detail page with 7 tabs. Shared by admin and tenant context.
 */

import { useState, type KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  LayoutDashboard,
  Sparkles,
  Zap,
  BarChart3,
  GitCompare,
  Play,
  Webhook,
} from 'lucide-react';
import { PageHeader } from '../../../shared/ui';
import { useAgentDetail } from '../hooks/useAgentDetail';
import {
  AgentOverviewTab,
  AgentLlmTab,
  AgentSkillsTab,
  AgentPerformanceTab,
  AgentAbTestTab,
  AgentRunsTab,
  AgentSyncTab,
} from '../components/AgentDetailTabs';
import { cn } from '@/lib/utils';

type AgentTab = 'overview' | 'llm' | 'skills' | 'performance' | 'abtest' | 'runs' | 'sync';

const TABS: { id: AgentTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'llm', label: 'LLM & Prompt', icon: Sparkles },
  { id: 'skills', label: 'Skills', icon: Zap },
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'abtest', label: 'A/B Testing', icon: GitCompare },
  { id: 'runs', label: 'Runs', icon: Play },
  { id: 'sync', label: 'Sync & Webhook', icon: Webhook },
];

function getTabId(tab: AgentTab): string {
  return `agent-detail-tab-${tab}`;
}

function getPanelId(tab: AgentTab): string {
  return `agent-detail-panel-${tab}`;
}

/** Renders tenant/admin agent detail tabs with keyboard-accessible navigation. */
export function AgentDetailPage() {
  const { agent, tenantId, isLoading } = useAgentDetail();
  const [activeTab, setActiveTab] = useState<AgentTab>('overview');
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin/');
  const backTo = isAdmin && tenantId ? `/admin/tenants/${tenantId}` : isAdmin ? '/admin/tenants' : tenantId ? `/tenants/${tenantId}` : '/tenants/me';
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

  if (isLoading || !agent) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agent Details" description="Loading…" />
        <div className="rounded-[var(--radius-card)] card-glass p-8 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            {agent === null && !isLoading ? 'Agent not found.' : 'Loading agent…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <Link to={backTo} className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4">
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {isAdmin ? 'Back to tenants' : 'Back'}
        </Link>
        <PageHeader
          title={agent.name}
          description={`${agent.tenantName} · ${agent.channel}`}
        />
      </motion.header>

      <div
        role="tablist"
        aria-label="Agent sections"
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
            <AgentOverviewTab agent={agent} />
          </motion.div>
        )}
        {activeTab === 'llm' && (
          <motion.div key="llm" id={getPanelId('llm')} role="tabpanel" aria-labelledby={getTabId('llm')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <AgentLlmTab llmConfig={agent.llmConfig} />
          </motion.div>
        )}
        {activeTab === 'skills' && (
          <motion.div key="skills" id={getPanelId('skills')} role="tabpanel" aria-labelledby={getTabId('skills')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <AgentSkillsTab skills={agent.skills} />
          </motion.div>
        )}
        {activeTab === 'performance' && (
          <motion.div key="performance" id={getPanelId('performance')} role="tabpanel" aria-labelledby={getTabId('performance')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <AgentPerformanceTab performance={agent.performance} />
          </motion.div>
        )}
        {activeTab === 'abtest' && (
          <motion.div key="abtest" id={getPanelId('abtest')} role="tabpanel" aria-labelledby={getTabId('abtest')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <AgentAbTestTab abTest={agent.abTest} />
          </motion.div>
        )}
        {activeTab === 'runs' && (
          <motion.div key="runs" id={getPanelId('runs')} role="tabpanel" aria-labelledby={getTabId('runs')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <AgentRunsTab recentRuns={agent.recentRuns} />
          </motion.div>
        )}
        {activeTab === 'sync' && (
          <motion.div key="sync" id={getPanelId('sync')} role="tabpanel" aria-labelledby={getTabId('sync')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <AgentSyncTab syncInfo={agent.syncInfo} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
