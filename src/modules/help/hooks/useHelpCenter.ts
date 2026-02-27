/**
 * Tenant help center. Create ticket, list my tickets, ticket detail.
 */

import { useState, useCallback, useMemo } from 'react';
import { supportAdapter } from '../../../adapters';
import type { SupportTicket } from '../../../shared/types/entities';

export function useHelpCenter(tenantId: string | undefined, authorId = 'u1') {
  const [refreshKey, setRefreshKey] = useState(0);

  const tickets = useMemo(() => {
    if (!tenantId) return [];
    return supportAdapter.listTickets({ tenantId });
  }, [tenantId, refreshKey]);

  const getTicket = useCallback((id: string) => supportAdapter.getTicket(id), []);

  const createTicket = useCallback(
    (data: {
      title: string;
      category: string;
      priority: SupportTicket['priority'];
      initialMessage: string;
    }) => {
      if (!tenantId) return null;
      const ticket = supportAdapter.createTicket({
        ...data,
        tenantId,
        authorId,
      });
      setRefreshKey((k) => k + 1);
      return ticket;
    },
    [tenantId, authorId]
  );

  const addMessage = useCallback((ticketId: string, authorId: string, body: string) => {
    supportAdapter.addMessage(ticketId, authorId, body);
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    tickets,
    getTicket,
    createTicket,
    addMessage,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
