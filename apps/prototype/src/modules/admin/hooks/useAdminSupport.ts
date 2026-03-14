/**
 * Admin support inbox. List tickets with filters, assign, reply.
 */

import { useState, useCallback, useMemo } from 'react';
import { supportAdapter, exportAdapter, auditAdapter, tenantsAdapter } from '../../../adapters';
import { useAsyncData } from '../../../shared/hooks/useAsyncData';
import type { SupportTicket } from '../../../shared/types/entities';

/** Returns admin support inbox data, filters, and ticket workflow actions. */
export function useAdminSupport() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [tenantFilter, setTenantFilter] = useState<string | ''>('');
  const [statusFilter, setStatusFilter] = useState<SupportTicket['status'] | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<SupportTicket['priority'] | ''>('');

  const { data: tickets, loading, refetch } = useAsyncData(
    () => {
      const filters: Parameters<typeof supportAdapter.listTickets>[0] = {};
      if (tenantFilter) filters.tenantId = tenantFilter;
      if (statusFilter) filters.status = statusFilter;
      if (priorityFilter) filters.priority = priorityFilter;
      return supportAdapter.listTickets(filters);
    },
    [refreshKey, tenantFilter, statusFilter, priorityFilter],
    [] as SupportTicket[],
  );

  const { data: tenants } = useAsyncData(
    () => tenantsAdapter.getAllTenants(),
    [],
    [],
  );

  const getTicket = useCallback((id: string) => supportAdapter.getTicket(id, { isAdmin: true }), []);

  const updateStatus = useCallback(async (id: string, status: SupportTicket['status']) => {
    await Promise.resolve(supportAdapter.updateStatus(id, status));
    setRefreshKey((k) => k + 1);
  }, []);

  const assignTicket = useCallback((ticketId: string, userId: string) => {
    supportAdapter.assignTicket(ticketId, userId);
    setRefreshKey((k) => k + 1);
  }, []);

  const addMessage = useCallback(async (ticketId: string, authorId: string, body: string) => {
    await Promise.resolve(supportAdapter.addMessage(ticketId, authorId, body));
    setRefreshKey((k) => k + 1);
  }, []);

  const logTicketAssigned = useCallback((ticketId: string, tenantId?: string) => {
    auditAdapter.log('ticket.assigned', { ticketId, tenantId });
  }, []);

  const exportTicketsCsv = useCallback((rows: Record<string, string>[], fileName: string) => {
    exportAdapter.exportCsv(rows, fileName);
  }, []);

  return {
    tickets,
    tenants,
    loading,
    getTicket,
    updateStatus,
    assignTicket,
    addMessage,
    logTicketAssigned,
    exportTicketsCsv,
    getTenantName: supportAdapter.getTenantName,
    filters: { tenantFilter, statusFilter, priorityFilter },
    setTenantFilter,
    setStatusFilter,
    setPriorityFilter,
    refresh: refetch,
  };
}
