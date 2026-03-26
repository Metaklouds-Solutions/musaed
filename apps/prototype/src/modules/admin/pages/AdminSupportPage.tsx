/**
 * Admin support inbox. Unified tickets, filters, assign, reply.
 * Saved filters: save/apply view presets.
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader, Button, Badge, PopoverSelect, Skeleton, EmptyState, Pagination, UnifiedFilterBar } from '../../../shared/ui';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { ArrowLeft, Download, MessageCircle } from 'lucide-react';
import { TicketList, TicketChatThread } from '../../shared/support';
import { useAdminSupport } from '../hooks/useAdminSupport';
import type { SupportTicket } from '../../../shared/types/entities';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import { useSavedFilters } from '../../../shared/hooks/useSavedFilters';
import { useUrlQueryState } from '../../../shared/hooks/useUrlQueryState';

const STATUS_OPTIONS: { value: SupportTicket['status']; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const PRIORITY_OPTIONS: { value: SupportTicket['priority']; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

function isSupportTicketStatus(s: unknown): s is SupportTicket['status'] {
  return s === 'open' || s === 'in_progress' || s === 'resolved';
}

function isSupportTicketPriority(s: unknown): s is SupportTicket['priority'] {
  return s === 'low' || s === 'medium' || s === 'high' || s === 'critical';
}

function toStatusFilter(s: unknown): SupportTicket['status'] | '' {
  if (s === '') return '';
  return isSupportTicketStatus(s) ? s : '';
}

function toPriorityFilter(s: unknown): SupportTicket['priority'] | '' {
  if (s === '') return '';
  return isSupportTicketPriority(s) ? s : '';
}

const PAGE_SIZE = 10;

function formatDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString();
}

/** Renders admin support inbox with filters, assignment, and ticket thread view. */
export function AdminSupportPage() {
  const ready = useDelayedReady();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    tickets,
    getTicket,
    updateStatus,
    assignTicket,
    addMessage,
    getTenantName,
    tenants,
    logTicketAssigned,
    exportTicketsCsv,
    setTenantFilter,
    setStatusFilter,
    setPriorityFilter,
  } = useAdminSupport();
  const { state, patchState, resetState } = useUrlQueryState({
    q: '',
    tenant: '',
    status: '',
    priority: '',
  });
  const [page, setPage] = useState(1);
  const { data: ticket, loading: ticketLoading, refetch: refetchTicket } = useAsyncData(
    () => (id ? getTicket(id) : null),
    [id, getTicket],
    null,
  );
  const statusLabel = typeof ticket?.status === 'string' ? ticket.status.replace('_', ' ') : 'open';
  const autoPromotedRef = useRef<string | null>(null);
  const latestMessage = ticket?.messages?.[ticket.messages.length - 1];
  const hasNewTenantMessage =
    Boolean(latestMessage) &&
    latestMessage?.authorId !== 'admin' &&
    latestMessage?.authorName !== 'Support';

  useEffect(() => {
    if (!id || !ticket) return;
    if (ticket.status !== 'open') return;
    if (autoPromotedRef.current === ticket.id) return;
    autoPromotedRef.current = ticket.id;

    void updateStatus(ticket.id, 'in_progress')
      .then(() => refetchTicket())
      .catch(() => {
        autoPromotedRef.current = null;
        toast.error('Failed to update ticket status');
      });
  }, [id, ticket, updateStatus, refetchTicket]);

  const handleAssign = useCallback(
    async (ticketId: string) => {
      try {
        const ticket = await getTicket(ticketId);
        await assignTicket(ticketId, 'admin');
        logTicketAssigned(ticketId, ticket?.tenantId);
        toast.success('Ticket assigned');
      } catch {
        toast.error('Failed to assign ticket');
      }
    },
    [assignTicket, getTicket, logTicketAssigned]
  );

  const handleReply = useCallback(
    async (ticketId: string, body: string) => {
      try {
        await addMessage(ticketId, 'admin', body);
      } catch {
        toast.error('Failed to send reply');
      }
    },
    [addMessage]
  );

  const search = state.q;
  const { saved, saveCurrent, apply, deleteFilter } = useSavedFilters({
    pageKey: 'admin-support',
    currentFilters: {
      q: state.q,
      tenant: state.tenant,
      status: state.status,
      priority: state.priority,
    },
    onApply: (savedFilters) => {
      patchState({
        q: typeof savedFilters.q === 'string' ? savedFilters.q : '',
        tenant: typeof savedFilters.tenant === 'string' ? savedFilters.tenant : '',
        status: typeof savedFilters.status === 'string' ? savedFilters.status : '',
        priority: typeof savedFilters.priority === 'string' ? savedFilters.priority : '',
      });
    },
  });

  useEffect(() => {
    setTenantFilter(state.tenant);
  }, [setTenantFilter, state.tenant]);

  useEffect(() => {
    setStatusFilter(toStatusFilter(state.status));
  }, [setStatusFilter, state.status]);

  useEffect(() => {
    setPriorityFilter(toPriorityFilter(state.priority));
  }, [setPriorityFilter, state.priority]);

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
  }, [state.tenant, state.status, state.priority, search]);

  const handleExport = useCallback(() => {
    const rows = searchedTickets.map((t) => ({
      Title: t.title,
      Tenant: getTenantName(t.tenantId),
      Category: t.category,
      Status: t.status,
      Priority: t.priority,
      Created: formatDate(t.createdAt),
    }));
    exportTicketsCsv(rows, `tickets-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Tickets exported');
  }, [searchedTickets, getTenantName, exportTicketsCsv]);

  if (id && ticketLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading ticket">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>

        {/* Meta bar skeleton */}
        <div className="rounded-xl panel-soft p-3 flex flex-wrap items-center gap-2">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>

        {/* Chat area skeleton */}
        <div className="rounded-[var(--radius-card)] card-glass overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
          <div className="p-4 border-b border-[var(--border-subtle)] flex flex-wrap items-center gap-3">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
          <div className="flex-1 p-4 space-y-4">
            <div className="flex gap-3 items-start">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-16 w-3/4 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3 items-start justify-end">
              <div className="space-y-2 flex-1 flex flex-col items-end">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-12 w-2/3 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            </div>
            <div className="flex gap-3 items-start">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-20 w-5/6 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id && !ticket) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={MessageCircle}
          title="Ticket not found"
          description={id ? `No ticket found for ID "${id}".` : 'Missing ticket ID.'}
        >
          <Button variant="secondary" onClick={() => navigate('/admin/support')}>
            Back to inbox
          </Button>
        </EmptyState>
      </div>
    );
  }

  if (id && ticket) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <PageHeader
            title={ticket.title}
            description={`${ticket.tenantName} · ${ticket.priority}`}
          />
          <Button variant="ghost" className="h-8 px-3 text-sm shrink-0 self-start" onClick={() => navigate('/admin/support')}>
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Back to Tickets
          </Button>
        </div>
        <div className="rounded-[var(--radius-card)] card-glass overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
          <div className="p-4 border-b border-[var(--border-subtle)] flex flex-wrap items-center gap-3">
            <span className="text-xs text-[var(--text-muted)]">{ticket.id}</span>
            <span className="text-xs text-[var(--text-muted)]">{ticket.tenantName}</span>
            <Badge status={ticket.priority === 'critical' ? 'error' : ticket.priority === 'high' ? 'warning' : 'pending'}>
              {ticket.priority}
            </Badge>
            <Badge status={ticket.status === 'resolved' ? 'active' : ticket.status === 'in_progress' ? 'pending' : 'warning'}>
              {statusLabel}
            </Badge>
            {hasNewTenantMessage && (
              <Badge status="warning">New message</Badge>
            )}
            <PopoverSelect
              value={ticket.status}
              onChange={(v) => {
                if (isSupportTicketStatus(v)) {
                  void updateStatus(ticket.id, v).catch(() => {
                    toast.error('Failed to update ticket status');
                  });
                }
              }}
              options={STATUS_OPTIONS}
              title="Status"
              aria-label="Update ticket status"
            />
            {!ticket.assignedTo && (
              <Button variant="secondary" className="h-8 px-3 text-sm" onClick={() => { void handleAssign(ticket.id); }}>
                Assign to me
              </Button>
            )}
          </div>
          <div className="flex-1 min-h-[300px]">
            <TicketChatThread
              messages={ticket.messages}
              currentUserId="admin"
              onReply={(body) => { void handleReply(ticket.id, body); }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading support inbox">
        {/* Header + export button skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40 rounded-md" />
            <Skeleton className="h-4 w-56 rounded-md" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md shrink-0" />
        </div>

        {/* Filter bar skeleton */}
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>

        {/* Ticket list skeleton */}
        <div className="rounded-[var(--radius-card)] card-glass p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`ticket-skel-${String(i)}`}
              className="rounded-lg bg-[var(--bg-elevated)] p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3 rounded-md" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-4 w-20 rounded-md shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Support Inbox"
          description={`Unified tickets from all tenants · ${searchedTickets.length} ticket${searchedTickets.length === 1 ? '' : 's'}`}
        />
        <Button variant="secondary" onClick={handleExport} className="shrink-0">
          <Download className="w-4 h-4" aria-hidden />
          Export CSV
        </Button>
      </div>
      <UnifiedFilterBar
        query={search}
        onQueryChange={(q) => patchState({ q })}
        searchPlaceholder="Search tickets..."
        fields={[
          {
            id: 'tenant',
            label: 'Tenant',
            value: state.tenant,
            options: [
              { value: '', label: 'All tenants' },
              ...tenants.map((tenant) => ({ value: tenant.id, label: tenant.name })),
            ],
          },
          {
            id: 'status',
            label: 'Status',
            value: state.status,
            options: [
              { value: '', label: 'All statuses' },
              ...STATUS_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
            ],
          },
          {
            id: 'priority',
            label: 'Priority',
            value: state.priority,
            options: [
              { value: '', label: 'All priorities' },
              ...PRIORITY_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
            ],
          },
        ]}
        onFieldChange={(fieldId, value) => {
          if (fieldId === 'tenant') patchState({ tenant: value });
          if (fieldId === 'status') patchState({ status: value });
          if (fieldId === 'priority') patchState({ priority: value });
        }}
        savedFilters={saved}
        onSaveFilter={saveCurrent}
        onApplyFilter={apply}
        onDeleteFilter={deleteFilter}
        activeFilterCount={[state.tenant, state.status, state.priority].filter(Boolean).length}
        onReset={() => resetState()}
      />
      <div className="rounded-[var(--radius-card)] card-glass p-4">
        <TicketList
          tickets={paginatedTickets}
          getTenantName={getTenantName}
          showTenant
          toPath={(tid) => `/admin/support/${tid}`}
        />
      </div>
      {totalPages > 1 && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={searchedTickets.length}
        />
      )}
    </div>
  );
}

