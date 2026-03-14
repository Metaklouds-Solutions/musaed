/**
 * Tenant help center. Create ticket, list my tickets, ticket detail.
 */

import { useState, useCallback } from 'react';
import { supportAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { SupportTicket } from '../../../shared/types/entities';

export function useHelpCenter(tenantId: string | undefined, authorId = 'u1') {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: tickets, loading, refetch } = useAsyncData(
    () => (tenantId ? supportAdapter.listTickets({ tenantId }) : []),
    [tenantId, refreshKey],
    [] as SupportTicket[]
  );

  const getTicket = useCallback((id: string) => supportAdapter.getTicket(id), []);

  const createTicket = useCallback(
    async (data: {
      title: string;
      category: string;
      priority: SupportTicket['priority'];
      initialMessage: string;
    }) => {
      if (!tenantId) return null;
      const ticket = await Promise.resolve(
        supportAdapter.createTicket({
          ...data,
          tenantId,
          authorId,
        })
      );
      setRefreshKey((k) => k + 1);
      refetch();
      return ticket;
    },
    [tenantId, authorId, refetch]
  );

  const addMessage = useCallback(
    async (ticketId: string, authorId: string, body: string) => {
      await Promise.resolve(supportAdapter.addMessage(ticketId, authorId, body));
      setRefreshKey((k) => k + 1);
      refetch();
    },
    [refetch]
  );

  return {
    tickets: Array.isArray(tickets) ? tickets : [],
    loading,
    getTicket,
    createTicket,
    addMessage,
    refresh: () => {
      setRefreshKey((k) => k + 1);
      refetch();
    },
  };
}
