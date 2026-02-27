/**
 * Single ticket row for list view.
 */

import { Link } from 'react-router-dom';
import { Badge } from '../../../shared/ui';
import type { SupportTicket } from '../../../shared/types/entities';

interface TicketRowProps {
  ticket: SupportTicket;
  tenantName?: string;
  showTenant?: boolean;
  to: string;
}

const priorityColors: Record<SupportTicket['priority'], 'error' | 'warning' | 'pending' | 'active'> = {
  critical: 'error',
  high: 'warning',
  medium: 'pending',
  low: 'active',
};

const statusColors: Record<SupportTicket['status'], 'error' | 'warning' | 'pending' | 'active'> = {
  open: 'warning',
  in_progress: 'pending',
  resolved: 'active',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function TicketRow({ ticket, tenantName, showTenant, to }: TicketRowProps) {
  return (
    <Link
      to={to}
      className="block p-4 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--sidebar-item-hover)] transition-colors border border-transparent hover:border-[var(--border-subtle)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[var(--text-primary)] truncate">{ticket.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {showTenant && tenantName && (
              <span className="text-xs text-[var(--text-muted)]">{tenantName}</span>
            )}
            <Badge status={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
            <Badge status={statusColors[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
            <span className="text-xs text-[var(--text-muted)]">{formatDate(ticket.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
