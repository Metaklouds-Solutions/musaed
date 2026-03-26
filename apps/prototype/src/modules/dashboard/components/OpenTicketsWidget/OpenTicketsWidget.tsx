/**
 * Tenant dashboard: open support tickets + latest.
 */

import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ViewButton } from '../../../../shared/ui';
import { HelpCircle } from 'lucide-react';
import type { TenantOpenTicket } from '../../../../shared/types';

interface OpenTicketsWidgetProps {
  tickets: TenantOpenTicket[];
}

function formatDateTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: 'text-[var(--error)]',
    high: 'text-[var(--warning)]',
    medium: 'text-[var(--text-secondary)]',
    low: 'text-[var(--text-muted)]',
  };
  return (
    <span className={`text-xs font-medium capitalize ${colors[priority] ?? 'text-[var(--text-muted)]'}`}>
      {priority}
    </span>
  );
}

/** Renders open support tickets with priority and link-through to detail. */
export function OpenTicketsWidget({ tickets }: OpenTicketsWidgetProps) {
  if (tickets.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-[var(--radius-card)] card-glass p-5"
      >
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Support Tickets</h2>
        <p className="text-sm text-[var(--text-muted)]">No open tickets.</p>
      </motion.section>
    );
  }

  return (
      <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
        className="relative overflow-hidden rounded-[var(--radius-card)] card-accent p-5"
    >
      <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-[var(--warning)]/10 blur-2xl pointer-events-none" />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Support Tickets</h2>
        <ViewButton to="/help">View all</ViewButton>
      </div>
      <div className="space-y-3">
        {tickets.map((t) => (
          <Link
            key={t.id}
            to={`/help/tickets/${t.id}`}
            className="block p-3 rounded-xl panel-soft hover:border-[var(--border-default)] hover:bg-[var(--sidebar-item-hover)] hover:shadow-[var(--shadow-elevated)] transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-[var(--text-primary)] truncate">{t.title}</p>
              <PriorityBadge priority={t.priority} />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {t.status} · {formatDateTime(t.createdAt)}
            </p>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}
