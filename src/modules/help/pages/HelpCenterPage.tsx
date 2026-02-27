/**
 * Tenant help center. Create ticket, my tickets list.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Modal, ModalHeader } from '../../../shared/ui';
import { TicketList, CreateTicketForm } from '../../shared/support';
import { useHelpCenter } from '../hooks/useHelpCenter';
import { useSession } from '../../../app/session/SessionContext';
import { Plus } from 'lucide-react';

export function HelpCenterPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const tenantId = user?.tenantId;
  const { tickets, createTicket } = useHelpCenter(tenantId, user?.id);
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = (data: {
    title: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    initialMessage: string;
  }) => {
    const ticket = createTicket(data);
    setCreateOpen(false);
    if (ticket) navigate(`/help/tickets/${ticket.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Help Center"
          description="Create a ticket or view your support requests"
        />
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4" aria-hidden />
          New Ticket
        </Button>
      </div>

      <div className="rounded-[var(--radius-card)] card-glass p-4">
        <TicketList
          tickets={tickets}
          toPath={(tid) => `/help/tickets/${tid}`}
        />
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Support Ticket"
        maxWidthRem={28}
      >
        <ModalHeader title="Create Support Ticket" onClose={() => setCreateOpen(false)} />
        <div className="p-5 bg-[var(--bg-subtle)]/30">
          {tenantId ? (
            <CreateTicketForm
              tenantId={tenantId}
              authorId={user?.id ?? ''}
              onSubmit={handleCreate}
              onCancel={() => setCreateOpen(false)}
            />
          ) : (
            <p className="text-sm text-[var(--text-muted)]">Sign in as a tenant to create tickets.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
