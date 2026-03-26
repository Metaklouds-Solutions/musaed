/**
 * Support tab content for SettingsPage.
 * Tenant-scoped ticket list with create-ticket modal and CSV export.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, Modal, ModalHeader, Pagination, Skeleton } from '../../../shared/ui';
import { TicketList, CreateTicketForm } from '../../shared/support';
import { useHelpCenter } from '../../help/hooks/useHelpCenter';
import { useSession } from '../../../app/session/SessionContext';
import { exportAdapter } from '../../../adapters';
import { Plus, Download, Search } from 'lucide-react';

const PAGE_SIZE = 10;
const SKELETON_ROWS = 4;

/**
 * Placeholder skeleton shown while support tickets are loading.
 */
function SupportSkeleton() {
  return (
    <div
      className="space-y-6 max-w-3xl animate-pulse"
      role="status"
      aria-label="Loading support tickets"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <div className="flex gap-2 shrink-0">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] card-glass p-4 space-y-3">
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-[3px] h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
            </div>
            <Skeleton className="h-3 w-16 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Renders the support ticket list, export button, and create-ticket modal.
 * Designed to be embedded as a tab panel inside SettingsPage.
 */
export function SupportSection() {
  const navigate = useNavigate();
  const { user } = useSession();
  const tenantId = user?.tenantId;
  const { tickets, loading, createTicket } = useHelpCenter(tenantId, user?.id);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const searchedTickets = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => t.title.toLowerCase().includes(q));
  }, [tickets, search]);

  const totalPages = Math.max(1, Math.ceil(searchedTickets.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedTickets = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return searchedTickets.slice(start, start + PAGE_SIZE);
  }, [searchedTickets, safePage]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleCreate = useCallback(
    async (data: {
      title: string;
      category: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      initialMessage: string;
    }) => {
      const ticket = await createTicket(data);
      setCreateOpen(false);
      if (ticket) {
        toast.success('Ticket created');
        navigate(`/help/tickets/${ticket.id}`);
      } else {
        toast.error('Failed to create ticket');
      }
    },
    [createTicket, navigate],
  );

  const handleExport = useCallback(async () => {
    const rows = searchedTickets.map((t) => ({
      Title: t.title,
      Category: t.category,
      Status: t.status,
      Priority: t.priority,
      Created: new Date(t.createdAt).toLocaleDateString(),
    }));
    await exportAdapter.exportTicketsCsv(rows);
    toast.success('Tickets exported');
  }, [searchedTickets]);

  if (loading) return <SupportSkeleton />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Support Tickets
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-[var(--ds-primary)]/10 text-[var(--ds-primary)] px-2 py-0.5 text-xs font-medium">
              {tickets.length}
            </span>
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Create a ticket or view your support requests
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4" aria-hidden />
            Export CSV
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" aria-hidden />
            New Ticket
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          aria-hidden
        />
        <input
          type="text"
          placeholder="Search tickets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)]/40"
        />
      </div>

      <div className="rounded-[var(--radius-card)] card-glass p-4">
        <TicketList tickets={paginatedTickets} toPath={(tid) => `/help/tickets/${tid}`} />
      </div>

      {totalPages > 1 && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

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
            <p className="text-sm text-[var(--text-muted)]">
              Sign in as a tenant to create tickets.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
