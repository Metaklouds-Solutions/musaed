/**
 * Admin support inbox. Unified tickets, filters, assign, reply.
 * Saved filters: save/apply view presets.
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader, Button, Badge, PopoverSelect, SavedFiltersDropdown, TableSkeleton, EmptyState } from '../../../shared/ui';
import { useDelayedReady } from '../../../shared/hooks/useDelayedReady';
import { useSavedFilters } from '../../../shared/hooks/useSavedFilters';
import { exportAdapter, auditAdapter } from '../../../adapters';
import { Download, MessageCircle } from 'lucide-react';
import { TicketList, TicketChatThread } from '../../shared/support';
import { useAdminSupport } from '../hooks/useAdminSupport';
import { tenantsAdapter } from '../../../adapters';
import type { SupportTicket } from '../../../shared/types/entities';

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
    filters,
    setTenantFilter,
    setStatusFilter,
    setPriorityFilter,
  } = useAdminSupport();

  const tenants = tenantsAdapter.getAllTenants();
  const ticket = id ? getTicket(id) : null;

  const handleAssign = useCallback(
    (ticketId: string) => {
      const ticket = getTicket(ticketId);
      assignTicket(ticketId, 'admin');
      auditAdapter.log('ticket.assigned', { ticketId, tenantId: ticket?.tenantId });
      toast.success('Ticket assigned');
    },
    [assignTicket, getTicket]
  );

  const handleReply = useCallback(
    (ticketId: string, body: string) => {
      addMessage(ticketId, 'admin', body);
    },
    [addMessage]
  );

  const currentFilters = useMemo(
    () => ({
      tenantFilter: filters.tenantFilter,
      statusFilter: filters.statusFilter,
      priorityFilter: filters.priorityFilter,
    }),
    [filters]
  );

  const handleApplySupportFilters = useCallback(
    (f: Record<string, unknown>) => {
      setTenantFilter(typeof f.tenantFilter === 'string' ? f.tenantFilter : '');
      setStatusFilter(toStatusFilter(f.statusFilter));
      setPriorityFilter(toPriorityFilter(f.priorityFilter));
    },
    [setTenantFilter, setStatusFilter, setPriorityFilter]
  );

  const savedFilters = useSavedFilters({
    pageKey: 'admin-support',
    currentFilters,
    onApply: handleApplySupportFilters,
  });

  const handleExport = useCallback(() => {
    const rows = tickets.map((t) => ({
      Title: t.title,
      Tenant: getTenantName(t.tenantId),
      Category: t.category,
      Status: t.status,
      Priority: t.priority,
      Created: new Date(t.createdAt).toLocaleDateString(),
    }));
    exportAdapter.exportCsv(rows, `tickets-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('Tickets exported');
  }, [tickets, getTenantName]);

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
        <PageHeader
          title={ticket.title}
          description={`${ticket.tenantName} · ${ticket.priority}`}
        />
        <div className="rounded-[var(--radius-card)] card-glass overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
          <div className="p-4 border-b border-[var(--border-subtle)] flex flex-wrap items-center gap-3">
            <Badge status={ticket.priority === 'critical' ? 'error' : ticket.priority === 'high' ? 'warning' : 'pending'}>
              {ticket.priority}
            </Badge>
            <Badge status={ticket.status === 'resolved' ? 'active' : ticket.status === 'in_progress' ? 'pending' : 'warning'}>
              {ticket.status.replace('_', ' ')}
            </Badge>
            <PopoverSelect
              value={ticket.status}
              onChange={(v) => { if (isSupportTicketStatus(v)) updateStatus(ticket.id, v); }}
              options={STATUS_OPTIONS}
              title="Status"
              aria-label="Update ticket status"
            />
            {!ticket.assignedTo && (
              <Button variant="secondary" className="h-8 px-3 text-sm" onClick={() => handleAssign(ticket.id)}>
                Assign to me
              </Button>
            )}
            <Button variant="ghost" className="h-8 px-3 text-sm" onClick={() => navigate('/admin/support')}>
              Back to list
            </Button>
          </div>
          <div className="flex-1 min-h-[300px]">
            <TicketChatThread
              messages={ticket.messages}
              currentUserId="admin"
              onReply={(body) => handleReply(ticket.id, body)}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader title="Support Inbox" description="Unified tickets from all tenants" />
        </div>
        <TableSkeleton rows={8} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Support Inbox"
          description="Unified tickets from all tenants"
        />
        <Button variant="secondary" onClick={handleExport} className="shrink-0">
          <Download className="w-4 h-4" aria-hidden />
          Export CSV
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <PopoverSelect
          value={filters.tenantFilter}
          onChange={setTenantFilter}
          options={[
            { value: '', label: 'All tenants' },
            ...tenants.map((t) => ({ value: t.id, label: t.name })),
          ]}
          title="Tenant"
          aria-label="Filter by tenant"
        />
        <PopoverSelect
          value={filters.statusFilter}
          onChange={(v) => setStatusFilter(toStatusFilter(v))}
          options={[
            { value: '', label: 'All statuses' },
            ...STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          ]}
          title="Status"
          aria-label="Filter by status"
        />
        <PopoverSelect
          value={filters.priorityFilter}
          onChange={(v) => setPriorityFilter(toPriorityFilter(v))}
          options={[
            { value: '', label: 'All priorities' },
            ...PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          ]}
          title="Priority"
          aria-label="Filter by priority"
        />
        <SavedFiltersDropdown
          saved={savedFilters.saved}
          onSave={(name) => {
            savedFilters.saveCurrent(name);
            toast.success(`View "${name}" saved`);
          }}
          onApply={savedFilters.apply}
          onDelete={savedFilters.deleteFilter}
        />
      </div>
      <div className="rounded-[var(--radius-card)] card-glass p-4">
        <TicketList
          tickets={tickets}
          getTenantName={getTenantName}
          showTenant
          toPath={(tid) => `/admin/support/${tid}`}
        />
      </div>
    </div>
  );
}
