/**
 * Admin support inbox. List tickets with filters, assign, reply.
 */

import { useState, useCallback, useMemo } from 'react';
import { supportAdapter, exportAdapter, auditAdapter, tenantsAdapter } from '../../../adapters';
import type { SupportTicket } from '../../../shared/types/entities';

export function useAdminSupport() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [tenantFilter, setTenantFilter] = useState<string | ''>('');
  const [statusFilter, setStatusFilter] = useState<SupportTicket['status'] | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<SupportTicket['priority'] | ''>('');

  const tickets = useMemo(() => {
    const filters: Parameters<typeof supportAdapter.listTickets>[0] = {};
    if (tenantFilter) filters.tenantId = tenantFilter;
    if (statusFilter) filters.status = statusFilter;
    if (priorityFilter) filters.priority = priorityFilter;
    return supportAdapter.listTickets(filters);
  }, [refreshKey, tenantFilter, statusFilter, priorityFilter]);
  const tenants = useMemo(() => tenantsAdapter.getAllTenants(), []);

  const getTicket = useCallback((id: string) => supportAdapter.getTicket(id), []);

  const updateStatus = useCallback((ticketId: string, status: SupportTicket['status']) => {
    supportAdapter.updateStatus(ticketId, status);
    setRefreshKey((k) => k + 1);
  }, []);

  const assignTicket = useCallback((ticketId: string, userId: string) => {
    supportAdapter.assignTicket(ticketId, userId);
    setRefreshKey((k) => k + 1);
  }, []);

  const addMessage = useCallback((ticketId: string, authorId: string, body: string) => {
    supportAdapter.addMessage(ticketId, authorId, body);
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
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
