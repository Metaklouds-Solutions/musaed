/**
 * API support adapter. Fetches support tickets from backend.
 */

import { api } from '../../lib/apiClient';
import type { SupportTicket, TicketMessage } from '../../shared/types/entities';

export interface TicketWithDetails extends SupportTicket {
  tenantName: string;
  messages: Array<TicketMessage & { authorName: string }>;
}

export interface ListTicketsFilters {
  tenantId?: string;
  status?: SupportTicket['status'];
  priority?: SupportTicket['priority'];
}

let cachedTickets: SupportTicket[] = [];

export const supportAdapter = {
  listTickets(filters?: ListTicketsFilters): SupportTicket[] {
    let out = [...cachedTickets];
    if (filters?.tenantId) out = out.filter((t) => t.tenantId === filters.tenantId);
    if (filters?.status) out = out.filter((t) => t.status === filters.status);
    if (filters?.priority) out = out.filter((t) => t.priority === filters.priority);
    return out.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  },

  getTicket(id: string): TicketWithDetails | null {
    const ticket = cachedTickets.find((t) => t.id === id);
    if (!ticket) return null;
    return { ...ticket, tenantName: '', messages: [] };
  },

  createTicket(data: {
    tenantId: string;
    title: string;
    category: string;
    priority: SupportTicket['priority'];
    authorId: string;
    initialMessage: string;
  }): SupportTicket {
    const ticket: SupportTicket = {
      id: `pending_${Date.now()}`,
      tenantId: data.tenantId,
      title: data.title,
      category: data.category,
      status: 'open',
      priority: data.priority,
      createdAt: new Date().toISOString(),
    };
    api.post('/tenant/support/tickets', {
      title: data.title,
      category: data.category,
      priority: data.priority,
      message: data.initialMessage,
    }).then((created: any) => {
      ticket.id = created._id ?? ticket.id;
      cachedTickets = [...cachedTickets, ticket];
    }).catch(() => {});
    return ticket;
  },

  addMessage(ticketId: string, _authorId: string, body: string): TicketMessage | null {
    const msg: TicketMessage = {
      id: `pending_${Date.now()}`,
      ticketId,
      authorId: _authorId,
      body,
      createdAt: new Date().toISOString(),
    };
    api.post(`/tenant/support/tickets/${ticketId}/messages`, { body }).catch(() => {});
    return msg;
  },

  updateStatus(ticketId: string, status: SupportTicket['status']): SupportTicket | null {
    const t = cachedTickets.find((x) => x.id === ticketId);
    if (!t) return null;
    t.status = status;
    api.patch(`/tenant/support/tickets/${ticketId}`, { status }).catch(() => {});
    return t;
  },

  assignTicket(ticketId: string, userId: string): SupportTicket | null {
    const t = cachedTickets.find((x) => x.id === ticketId);
    if (!t) return null;
    t.assignedTo = userId;
    return t;
  },

  getAuthorName(authorId: string): string {
    return authorId === 'admin' ? 'Support' : authorId;
  },

  getTenantName(tenantId: string): string {
    return tenantId;
  },

  async refresh(): Promise<void> {
    try {
      cachedTickets = await api.get<SupportTicket[]>('/tenant/support/tickets');
    } catch {
      // keep cache as-is
    }
  },
};
