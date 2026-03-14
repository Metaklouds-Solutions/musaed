/**
 * List of tickets. Used by Admin and Tenant help center.
 */

import { TicketRow } from './TicketRow';
import { EmptyState } from '../../../shared/ui';
import { MessageCircle } from 'lucide-react';
import type { SupportTicket } from '../../../shared/types/entities';

interface TicketListProps {
  tickets: SupportTicket[];
  getTenantName?: (tenantId: string) => string;
  showTenant?: boolean;
  toPath: (ticketId: string) => string;
}

export function TicketList({ tickets, getTenantName, showTenant, toPath }: TicketListProps) {
  const list = Array.isArray(tickets) ? tickets : [];
  if (list.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No tickets found"
        description="No support tickets match the current filters. Try adjusting your filters or check back later."
      />
    );
  }

  return (
    <div className="space-y-2">
      {list.map((t) => (
        <TicketRow
          key={t.id}
          ticket={t}
          tenantName={showTenant && getTenantName ? getTenantName(t.tenantId) : undefined}
          showTenant={showTenant}
          to={toPath(t.id)}
        />
      ))}
    </div>
  );
}
