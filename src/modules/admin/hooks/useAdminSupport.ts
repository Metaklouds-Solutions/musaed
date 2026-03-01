/**
 * Admin support inbox. Optimistic status updates. [PHASE-7-OPTIMISTIC-UPDATES]
 */

import { useState, useCallback, useMemo } from 'react';
import { supportAdapter } from '../../../adapters';
import { useOptimisticList } from '../../../shared/hooks/useOptimisticList';
import type { SupportTicket } from '../../../shared/types/entities';

export function useAdminSupport() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [tenantFilter, setTenantFilter] = useState<string | ''>('');
  const [statusFilter, setStatusFilter] = useState<SupportTicket['status'] | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<SupportTicket['priority'] | ''>('');

  const rawTickets = useMemo(() => {
    const filters: Parameters<typeof supportAdapter.listTickets>[0] = {};
    if (tenantFilter) filters.tenantId = tenantFilter;
    if (statusFilter) filters.status = statusFilter;
    if (priorityFilter) filters.priority = priorityFilter;
    return supportAdapter.listTickets(filters);
  }, [refreshKey, tenantFilter, statusFilter, priorityFilter]);

  const { items: tickets, patchOptimistic, rollbackPatch, commit } = useOptimisticList<SupportTicket>({
    items: rawTickets,
    getKey: (t) => t.id,
  });

  const getTicket = useCallback(
    (id: string) => {
      const base = supportAdapter.getTicket(id);
      if (!base) return null;
      const patched = tickets.find((t) => t.id === id);
      if (patched && patched.status !== base.status) {
        return { ...base, status: patched.status };
      }
      return base;
    },
    [tickets]
  );

  const updateStatus = useCallback(
    (ticketId: string, status: SupportTicket['status']) => {
      patchOptimistic(ticketId, { status });
      try {
        supportAdapter.updateStatus(ticketId, status);
        setRefreshKey((k) => k + 1);
        commit();
      } catch {
        rollbackPatch(ticketId);
      }
    },
    [patchOptimistic, rollbackPatch, commit]
  );

  const assignTicket = useCallback((ticketId: string, userId: string) => {
    supportAdapter.assignTicket(ticketId, userId);
    setRefreshKey((k) => k + 1);
  }, []);

  const addMessage = useCallback((ticketId: string, authorId: string, body: string) => {
    supportAdapter.addMessage(ticketId, authorId, body);
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    tickets,
    getTicket,
    updateStatus,
    assignTicket,
    addMessage,
    getTenantName: supportAdapter.getTenantName,
    filters: { tenantFilter, statusFilter, priorityFilter },
    setTenantFilter,
    setStatusFilter,
    setPriorityFilter,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
