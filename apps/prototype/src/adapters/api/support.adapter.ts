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
  /** Tenant scope for callers; selects the tenant endpoint when present. */
  tenantId?: string;
  /** Backend-supported query filters. */
  status?: SupportTicket['status'];
  priority?: SupportTicket['priority'];
  /** Force admin endpoints even when tenantId filter is provided. */
  isAdmin?: boolean;
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
      // The backend only supports status/priority query params here; tenant scope is expressed via the path.
      if (filters?.status) params.status = filters.status;
      if (filters?.priority) params.priority = filters.priority;
      const isAdmin = filters?.isAdmin ?? !filters?.tenantId;
      const base = isAdmin ? '/admin/support' : '/tenant/support/tickets';
      const qs = new URLSearchParams(params).toString();
      const resp = await api.get<{ data: any[] }>(`${base}?${qs}`);
      return (resp.data ?? []).map(mapTicket);
    } catch {
      return [];
    }
  },

  async getTicket(id: string, options?: { isAdmin?: boolean }): Promise<TicketWithDetails | null> {
    try {
      const base = options?.isAdmin ? '/admin/support' : '/tenant/support/tickets';
      const t = await api.get<any>(`${base}/${id}`);
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

  async addMessage(
    ticketId: string,
    _authorId: string,
    body: string,
    options?: { isAdmin?: boolean },
  ): Promise<TicketMessage | null> {
    try {
      const base = options?.isAdmin ? '/admin/support' : '/tenant/support/tickets';
      const resp = await api.post<any>(`${base}/${ticketId}/messages`, { body });
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

  async updateStatus(
    ticketId: string,
    status: SupportTicket['status'],
    options?: { isAdmin?: boolean },
  ): Promise<SupportTicket | null> {
    const base = options?.isAdmin ? '/admin/support' : '/tenant/support/tickets';
    await api.patch(`${base}/${ticketId}`, { status });
    return null;
  },

  async assignTicket(
    ticketId: string,
    userId: string,
    options?: { isAdmin?: boolean },
  ): Promise<SupportTicket | null> {
    if (options?.isAdmin) {
      // Backend does not expose an admin assignment endpoint yet.
      console.warn(
        `[support] assignTicket is a safe no-op for admin (ticketId=${ticketId}, userId=${userId}).`,
      );
    }
    return null;
  },

  getAuthorName(authorId: string): string {
    return authorId === 'admin' ? 'Support' : authorId;
  },

  getTenantName(tenantId: string): string {
    return tenantId;
  },
};
