/**
 * Admin agent detail page. Skills, locale, status, sync.
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Bot, RefreshCw, Sparkles } from 'lucide-react';
import { PageHeader } from '../../../shared/ui';
import { agentsAdapter } from '../../../adapters/local/agents.adapter';
import { useParams } from 'react-router-dom';

function formatRelativeTime(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)} mins ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  return `${Math.floor(sec / 86400)} days ago`;
}

export function AdminAgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const agent = id ? agentsAdapter.getDetails(id) : null;

  if (!agent) {
    return (
      <div className="space-y-6">
        <PageHeader title="Agent Details" description="Loading…" />
        <div className="rounded-[var(--radius-card)] card-glass p-8 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            Agent not found.
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
        transition={{ duration: 0.3 }}
      >
        <Link
          to="/admin/agents"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to agents
        </Link>
        <PageHeader
          title={agent.name}
          description={`${agent.voice} · ${agent.language} · ${agent.externalAgentId}`}
        />
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="rounded-[var(--radius-card)] card-glass p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5" aria-hidden />
            Status
          </h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Status</dt>
              <dd className="font-medium text-[var(--text-primary)] capitalize">{agent.status}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Linked Tenant</dt>
              <dd className="font-medium text-[var(--text-primary)]">
                {agent.tenantId ? (
                  <Link to={`/admin/tenants/${agent.tenantId}`} className="text-[var(--ds-primary)] hover:underline">
                    {agent.tenantName ?? agent.tenantId}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[var(--radius-card)] card-glass p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5" aria-hidden />
            Sync Status
          </h2>
          <p className="text-sm text-[var(--text-primary)]">
            Last synced: {formatRelativeTime(agent.lastSyncedAt)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {new Date(agent.lastSyncedAt).toLocaleString()}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="rounded-[var(--radius-card)] card-glass p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" aria-hidden />
            Enabled Skills
          </h2>
          {agent.enabledSkills.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No skills enabled.</p>
          ) : (
            <ul className="space-y-2">
              {agent.enabledSkills.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-elevated)]/50"
                >
                  <span className="font-medium text-[var(--text-primary)]">{s.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">Priority {s.priority}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
