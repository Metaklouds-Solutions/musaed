/**
 * Tenant dashboard: open support tickets + latest.
 */

import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import type { TenantOpenTicket } from '../../../../shared/types';

interface OpenTicketsWidgetProps {
  tickets: TenantOpenTicket[];
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
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
      className="rounded-[var(--radius-card)] card-glass p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Support Tickets</h2>
        <Link to="/help" className="text-sm font-medium text-[var(--ds-primary)] hover:underline">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {tickets.map((t) => (
          <Link
            key={t.id}
            to={`/help/tickets/${t.id}`}
            className="block p-3 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--sidebar-item-hover)] transition-colors"
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
