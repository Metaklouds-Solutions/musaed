/**
 * Tenant ticket detail. Chat thread, reply.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, Button, Badge } from '../../../shared/ui';
import { TicketChatThread } from '../../shared/support';
import { useHelpCenter } from '../hooks/useHelpCenter';
import { useSession } from '../../../app/session/SessionContext';
import { ArrowLeft } from 'lucide-react';

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const { getTicket, addMessage } = useHelpCenter(user?.tenantId);

  const ticket = id ? getTicket(id) : null;

  if (!id || !ticket) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ticket" description="Loading…" />
        <div className="rounded-[var(--radius-card)] card-glass p-8 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            {!id ? 'No ticket selected.' : 'Ticket not found.'}
          </p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate('/help')}>
            Back to Help Center
          </Button>
        </div>
      </div>
    );
  }

  const handleReply = (body: string) => {
    addMessage(ticket.id, user?.id ?? 'u1', body);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          className="h-8 px-2"
          onClick={() => navigate('/help')}
          aria-label="Back to Help Center"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
        </Button>
        <PageHeader
          title={ticket.title}
          description={`${ticket.priority} · ${ticket.status.replace('_', ' ')}`}
        />
      </div>

      <div className="rounded-[var(--radius-card)] card-glass overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
        <div className="p-4 border-b border-[var(--border-subtle)] flex flex-wrap items-center gap-2">
          <Badge status={ticket.priority === 'critical' ? 'error' : ticket.priority === 'high' ? 'warning' : 'pending'}>
            {ticket.priority}
          </Badge>
          <Badge status={ticket.status === 'resolved' ? 'active' : 'pending'}>
            {ticket.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex-1 min-h-[300px]">
          <TicketChatThread
            messages={ticket.messages}
            currentUserId={user?.id}
            onReply={handleReply}
          />
        </div>
      </div>
    </div>
  );
}
