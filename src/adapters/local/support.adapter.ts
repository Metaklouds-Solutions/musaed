/**
 * Local support adapter. Tickets and messages. In-memory mutations.
 */

import {
  seedSupportTickets,
  seedTicketMessages,
  seedTenants,
  seedStaffUsers,
} from '../../mock/seedData';
import type { SupportTicket, TicketMessage } from '../../shared/types/entities';

/** Mutable copies for in-memory mutations. */
let tickets: SupportTicket[] = seedSupportTickets.map((t) => ({ ...t }));
let messages: TicketMessage[] = seedTicketMessages.map((m) => ({ ...m }));

function getTenantName(tenantId: string): string {
  return seedTenants.find((t) => t.id === tenantId)?.name ?? tenantId;
}

function getAuthorName(authorId: string): string {
  if (authorId === 'admin') return 'Support';
  const u = seedStaffUsers.find((s) => s.userId === authorId);
  return u?.name ?? authorId;
}

export interface TicketWithDetails extends SupportTicket {
  tenantName: string;
  messages: Array<TicketMessage & { authorName: string }>;
}

export interface ListTicketsFilters {
  tenantId?: string;
  status?: SupportTicket['status'];
  priority?: SupportTicket['priority'];
}

export const supportAdapter = {
  /** List tickets (admin: all; tenant: filtered by tenantId). */
  listTickets(filters?: ListTicketsFilters): SupportTicket[] {
    let out = [...tickets];
    if (filters?.tenantId) {
      out = out.filter((t) => t.tenantId === filters.tenantId);
    }
    if (filters?.status) {
      out = out.filter((t) => t.status === filters.status);
    }
    if (filters?.priority) {
      out = out.filter((t) => t.priority === filters.priority);
    }
    return out.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  },

  /** Get ticket with messages for detail view. */
  getTicket(id: string): TicketWithDetails | null {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) return null;
    const ticketMessages = messages
      .filter((m) => m.ticketId === id)
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
      .map((m) => ({ ...m, authorName: getAuthorName(m.authorId) }));
    return {
      ...ticket,
      tenantName: getTenantName(ticket.tenantId),
      messages: ticketMessages,
    };
  },

  /** Create ticket (tenant). */
  createTicket(data: {
    tenantId: string;
    title: string;
    category: string;
    priority: SupportTicket['priority'];
    authorId: string;
    initialMessage: string;
  }): SupportTicket {
    const id = `st_${Date.now()}`;
    const now = new Date().toISOString();
    const ticket: SupportTicket = {
      id,
      tenantId: data.tenantId,
      title: data.title,
      category: data.category,
      status: 'open',
      priority: data.priority,
      createdAt: now,
    };
    tickets.push(ticket);
    const msg: TicketMessage = {
      id: `tm_${Date.now()}`,
      ticketId: id,
      authorId: data.authorId,
      body: data.initialMessage,
      createdAt: now,
    };
    messages.push(msg);
    return ticket;
  },

  /** Add message to ticket. */
  addMessage(ticketId: string, authorId: string, body: string): TicketMessage | null {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;
    const msg: TicketMessage = {
      id: `tm_${Date.now()}`,
      ticketId,
      authorId,
      body,
      createdAt: new Date().toISOString(),
    };
    messages.push(msg);
    return msg;
  },

  /** Update ticket status. */
  updateStatus(ticketId: string, status: SupportTicket['status']): SupportTicket | null {
    const t = tickets.find((x) => x.id === ticketId);
    if (!t) return null;
    t.status = status;
    return t;
  },

  /** Assign ticket to admin user. */
  assignTicket(ticketId: string, userId: string): SupportTicket | null {
    const t = tickets.find((x) => x.id === ticketId);
    if (!t) return null;
    t.assignedTo = userId;
    return t;
  },

  /** Get author display name. */
  getAuthorName,
  getTenantName,
};
