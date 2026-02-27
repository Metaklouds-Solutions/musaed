/**
 * Admin support inbox. Unified tickets, filters, assign, reply.
 */

import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Button, Badge } from '../../../shared/ui';
import { TicketList, TicketChatThread } from '../../shared/support';
import { useAdminSupport } from '../hooks/useAdminSupport';
import { tenantsAdapter } from '../../../adapters/local/tenants.adapter';
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

export function AdminSupportPage() {
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
      assignTicket(ticketId, 'admin');
    },
    [assignTicket]
  );

  const handleReply = useCallback(
    (ticketId: string, body: string) => {
      addMessage(ticketId, 'admin', body);
    },
    [addMessage]
  );

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
            <select
              value={ticket.status}
              onChange={(e) => updateStatus(ticket.id, e.target.value as SupportTicket['status'])}
              className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
              aria-label="Update ticket status"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Inbox"
        description="Unified tickets from all tenants"
      />
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
          aria-label="Filter by tenant"
        >
          <option value="">All tenants</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          value={filters.statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SupportTicket['status'] | '')}
          className="px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filters.priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as SupportTicket['priority'] | '')}
          className="px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
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
