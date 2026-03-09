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

function mapTicket(t: any): SupportTicket {
  return {
    id: t._id,
    tenantId: typeof t.tenantId === 'string' ? t.tenantId : t.tenantId?._id ?? '',
    title: t.title,
    category: t.category,
    status: t.status,
    priority: t.priority,
    assignedTo: t.assignedTo ?? undefined,
    createdAt: t.createdAt,
  };
}

export const supportAdapter = {
  async listTickets(filters?: ListTicketsFilters): Promise<SupportTicket[]> {
    try {
      const params: Record<string, string> = { page: '1', limit: '100' };
      if (filters?.status) params.status = filters.status;
      if (filters?.priority) params.priority = filters.priority;
      const isAdmin = !filters?.tenantId;
      const base = isAdmin ? '/admin/support' : '/tenant/support/tickets';
      const qs = new URLSearchParams(params).toString();
      const resp = await api.get<{ data: any[] }>(`${base}?${qs}`);
      return (resp.data ?? []).map(mapTicket);
    } catch {
      return [];
    }
  },

  async getTicket(id: string): Promise<TicketWithDetails | null> {
    try {
      const t = await api.get<any>(`/tenant/support/tickets/${id}`);
      if (!t) return null;
      const createdBy = t.createdBy ?? {};
      return {
        ...mapTicket(t),
        tenantName: t.tenantId?.name ?? '',
        messages: (t.messages ?? []).map((m: any) => ({
          id: m._id ?? `msg_${Date.now()}`,
          ticketId: t._id,
          authorId: typeof m.authorId === 'string' ? m.authorId : m.authorId?._id ?? '',
          body: m.body,
          createdAt: m.createdAt,
          authorName: m.authorId?.name ?? createdBy.name ?? '',
        })),
      };
    } catch {
      return null;
    }
  },

  async createTicket(data: {
    tenantId: string;
    title: string;
    category: string;
    priority: SupportTicket['priority'];
    authorId: string;
    initialMessage: string;
  }): Promise<SupportTicket> {
    const created = await api.post<any>('/tenant/support/tickets', {
      title: data.title,
      category: data.category,
      priority: data.priority,
      body: data.initialMessage,
    });
    return mapTicket(created);
  },

  async addMessage(ticketId: string, _authorId: string, body: string): Promise<TicketMessage | null> {
    try {
      const resp = await api.post<any>(`/tenant/support/tickets/${ticketId}/messages`, { body });
      const msgs = resp.messages ?? [];
      const last = msgs[msgs.length - 1];
      if (!last) return null;
      return {
        id: last._id ?? `msg_${Date.now()}`,
        ticketId,
        authorId: typeof last.authorId === 'string' ? last.authorId : last.authorId?._id ?? '',
        body: last.body,
        createdAt: last.createdAt,
      };
    } catch {
      return null;
    }
  },

  updateStatus(ticketId: string, status: SupportTicket['status']): SupportTicket | null {
    api.patch(`/tenant/support/tickets/${ticketId}`, { status }).catch(() => {});
    return null;
  },

  assignTicket(ticketId: string, userId: string): SupportTicket | null {
    return null;
  },

  getAuthorName(authorId: string): string {
    return authorId === 'admin' ? 'Support' : authorId;
  },

  getTenantName(tenantId: string): string {
    return tenantId;
  },
};
